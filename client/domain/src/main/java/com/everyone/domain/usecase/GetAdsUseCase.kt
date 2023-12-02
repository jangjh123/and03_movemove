package com.everyone.domain.usecase

import com.everyone.domain.model.Advertisements
import com.everyone.domain.model.base.DataState
import com.everyone.domain.repository.AdsRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetAdsUseCase @Inject constructor(private val adsRepository: AdsRepository) {
    suspend operator fun invoke(): Flow<DataState<Advertisements>> = adsRepository.getAds()
}