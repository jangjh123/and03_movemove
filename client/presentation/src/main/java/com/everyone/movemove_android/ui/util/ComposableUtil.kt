package com.everyone.movemove_android.ui.util

import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.unit.Dp
import kotlin.math.roundToInt

@Composable
fun Modifier.addFocusCleaner(): Modifier {
    val focusManager = LocalFocusManager.current

    return this.pointerInput(Unit) {
        detectTapGestures {
            focusManager.clearFocus()
        }
    }
}

@Composable
fun BranchedModifier(
    value: Boolean,
    onDefault: @Composable () -> Modifier,
    onTrue: (@Composable (Modifier) -> Modifier)? = null,
    onFalse: (@Composable (Modifier) -> Modifier)? = null,
): Modifier {
    val defaultModifier: Modifier = onDefault()
    var modifier: Modifier = onDefault()
    modifier = if (value) {
        onTrue?.let {
            onTrue(modifier)
        } ?: defaultModifier
    } else {
        onFalse?.let {
            onFalse(modifier)
        } ?: defaultModifier
    }

    return modifier
}

@Composable
fun Modifier.clickableWithoutRipple(onClick: () -> Unit): Modifier {
    return this.clickable(
        interactionSource = MutableInteractionSource(),
        indication = null
    ) {
        onClick()
    }
}

@Composable
fun Float.pxToDp() = with(LocalDensity.current) {
    roundToInt().toDp()
}

@Composable
fun Int.pxToDp() = with(LocalDensity.current) {
    this@pxToDp.toDp()
}

@Composable
fun Dp.toPx() = with(LocalDensity.current) {
    this@toPx.toPx()
}