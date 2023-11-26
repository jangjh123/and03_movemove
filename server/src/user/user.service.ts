/* eslint-disable no-underscore-dangle */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { Video } from 'src/video/schemas/video.schema';
import { putObject } from 'src/ncpAPI/putObject';
import { User } from './schemas/user.schema';
import { UploadedVideoResponseDto } from './dto/uploaded-video-response.dto';
import { UserNotFoundException } from 'src/exceptions/user-not-found.exception';
import { getObject } from 'src/ncpAPI/getObject';
import * as _ from 'lodash';
import { deleteObject } from 'src/ncpAPI/deleteObject';
import { ProfileDto } from './dto/profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('Video') private VideoModel: Model<Video>,
     @InjectModel(User.name) private UserModel: Model<User>) {}

  async getProfile(userId: string) {
    const user = await this.UserModel.findOne({ uuid: userId });

    if (!user) {
      throw new UserNotFoundException();
    }
    const { uuid, profileImageExtension, nickname, statusMessage } = user;
    const profileImage = profileImageExtension
      ? await getObject(
          process.env.PROFILE_BUCKET,
          `${uuid}.${profileImageExtension}`,
        )
      : null;
    return new ProfileDto({
      nickname,
      statusMessage,
      ...(profileImage && { profileImage }),
    });
  }

  async patchProfile(
    profileDto: ProfileDto,
    profileImage: Express.Multer.File,
    uuid: string,
  ): Promise<ProfileDto> {
    const updateOption = _.omitBy(profileDto, _.isEmpty); // profileDto 중 빈 문자열인 필드 제거
    const user = await this.UserModel.findOne({ uuid });
    if (user.nickname === updateOption.nickname) {
      // 실제로 변경된 필드만 updateOption에 남기기
      delete updateOption.nickname;
    }
    if (user.statusMessage === updateOption.statusMessage) {
      delete updateOption.statusMessage;
    }

    let updatedProfileImage;
    if (profileImage) {
      const profileImageExtension = profileImage.originalname.split('.').pop();
      putObject(
        process.env.PROFILE_BUCKET,
        `${uuid}.${profileImageExtension}`,
        profileImage.buffer,
      );
      updateOption.profileImageExtension = profileImageExtension;
      updatedProfileImage = profileImage.buffer;
    } else if (
      'profileImage' in profileDto &&
      user.profileImageExtension !== null
    ) {
      // profileImage 필드를 빈 문자열로 주었고, 기존 프로필이미지가 있었다면 삭제
      deleteObject(
        process.env.PROFILE_BUCKET,
        `${uuid}.${user.profileImageExtension}`,
      );
      updateOption.profileImageExtension = null;
      updatedProfileImage = null;
    }

    await this.UserModel.updateOne({ uuid }, updateOption);
    if (updatedProfileImage !== undefined) {
      updateOption.profileImage = updatedProfileImage;
      delete updateOption.profileImageExtension;
    }
    return updateOption;
  }

  async getUploadedVideos(
    uuid: string,
    limit: number,
    lastId: string,
  ): Promise<UploadedVideoResponseDto> {
    const uploaderData = await this.UserModel.findOne(
      { uuid },
      { __v: 0, actions: 0 },
    );
    // eslint-disable-next-line prettier/prettier
    const { _id: uploaderId, profileImageExtension, ...uploaderInfo } = uploaderData.toObject();
    const profileImage = await this.getBucketImage(
      process.env.PROFILE_BUCKET,
      profileImageExtension,
      uuid,
    );
    const uploader = { ...uploaderInfo, ...(profileImage && { profileImage }) };

    const condition = {
      uploaderId,
      ...(lastId && { _id: { $lt: lastId } }),
    };
    const videoData = await this.VideoModel.find(condition, {
      uploaderId: 0,
      videoExtension: 0,
      __v: 0,
    })
      .sort({ _id: -1 })
      .limit(limit);

    const videos = await this.getVideos(videoData);
    return { videos, uploader };
  }

  async getVideos(videoData: Array<Document>) {
    const videos = await Promise.all(
      videoData.map(async (video) => {
        const { thumbnailExtension, ...videoInfo } = video.toObject();
        const manifest = `${process.env.MANIFEST_URL_PREFIX}${videoInfo._id}_,${process.env.ENCODING_SUFFIXES}${process.env.MANIFEST_URL_SUFFIX}`;
        const thumbnailImage = await this.getBucketImage(
          process.env.THUMBNAIL_BUCKET,
          thumbnailExtension,
          videoInfo._id,
        );
        return { ...videoInfo, manifest, thumbnailImage };
      }),
    );
    return videos;
  }

  async getBucketImage(bucket: string, ImageExtension: string, uuid: string) {
    const bucketImage = ImageExtension
      ? await getObject(bucket, `${uuid}.${ImageExtension}`)
      : null;
    return bucketImage;
  }
}
