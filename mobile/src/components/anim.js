// Tiny animation toolkit built on React Native's built-in Animated API —
// no extra native deps, works everywhere including Expo Go.
//
//   <FadeInView delay={80}>…</FadeInView>   fade + rise on mount (stagger via delay)
//   <PressScale onPress={…}>…</PressScale>  springy scale-down while pressed
//   <PopIn>…</PopIn>                        overshoot pop for badges / success marks
//   usePulse()                              looping soft pulse (returns scale value)
import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

// Fade in + slide up. `delay` lets lists stagger their children.
export function FadeInView({ children, delay = 0, duration = 380, distance = 14, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration, delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration, delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, duration]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// Pressable that springs down to `to` scale while held. Drop-in Pressable.
export function PressScale({ children, onPress, disabled, to = 0.96, style, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: to, useNativeDriver: true,
      speed: 40, bounciness: 0,
    }).start();
  }, [scale, to]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true,
      speed: 24, bounciness: 8,
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : pressIn}
      onPressOut={disabled ? undefined : pressOut}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Springy overshoot entrance — great for badges and success check bubbles.
// Re-runs whenever `trigger` changes (e.g. cart count).
export function PopIn({ children, trigger, style }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0.3);
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true,
      speed: 22, bounciness: 14,
    }).start();
  }, [scale, trigger]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

// Soft infinite pulse — returns an Animated scale value you attach yourself.
export function usePulse({ from = 1, to = 1.06, duration = 900 } = {}) {
  const scale = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: to, duration,
          easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: from, duration,
          easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, from, to, duration]);
  return scale;
}
