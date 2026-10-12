import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import type { ParamListBase } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { Camera, ImageIcon, Zap, ZapOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import { FlowHeader } from '@/components/add-voucher/FlowHeader';
import { colors } from '@/lib/theme';

interface CaptureStepProps {
  /** Open the photo library straight away (from Home's "Pick from library"). */
  startWithLibrary: boolean;
  onClose: () => void;
  onCaptured: (uri: string, width: number, height: number) => void;
}

const CORNER = 'absolute h-[38px] w-[38px] border-paper';

/** Step 1: full-bleed camera with a voucher frame, flash toggle, shutter and library import. */
export function CaptureStep({ startWithLibrary, onClose, onCaptured }: CaptureStepProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  /** The camera couldn't start (or there is none, as in the Simulator): fall back to the library. */
  const [cameraError, setCameraError] = useState<string | null>(null);
  /** One photo failed; the camera stays live so the user can simply try again. */
  const [captureFailed, setCaptureFailed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [taking, setTaking] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // Deliberately not a disabling "busy" state: if iOS never shows the picker, the screen must stay usable.
  const picking = useRef(false);
  const pickFromLibrary = async () => {
    if (picking.current) return;
    picking.current = true;
    try {
      // Full screen, like the rest of the flow. The default page sheet also hangs mid-animation in iOS 18 simulators.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (asset) onCaptured(asset.uri, asset.width, asset.height);
    } catch (error) {
      console.warn('Clippr: photo library failed', error);
    } finally {
      picking.current = false;
    }
  };

  const takePhoto = async () => {
    if (!camera.current || !ready) return;
    setTaking(true);
    setCaptureFailed(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const picture = await camera.current.takePictureAsync({ quality: 0.9 });
      onCaptured(picture.uri, picture.width, picture.height);
    } catch (error) {
      console.warn('Clippr: taking the photo failed', error);
      setCaptureFailed(true);
    } finally {
      setTaking(false);
    }
  };

  // Home's "Pick from library" lands here. iOS won't present the picker while this modal is still
  // animating in (and the promise then never settles), so wait for the transition to finish.
  const onArrival = useRef(startWithLibrary ? pickFromLibrary : null);
  useEffect(
    () =>
      navigation.addListener('transitionEnd', (event) => {
        if (event.data.closing || !onArrival.current) return;
        const open = onArrival.current;
        onArrival.current = null;
        open();
      }),
    [navigation],
  );

  const granted = permission?.granted ?? false;
  const showCamera = granted && !cameraError;

  return (
    <View className="flex-1 bg-camera">
      <StatusBar style="light" />
      {showCamera ? (
        <CameraView
          ref={camera}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          facing="back"
          flash={flash ? 'on' : 'off'}
          onCameraReady={() => setReady(true)}
          onMountError={(e) => setCameraError(e.message)}
        />
      ) : null}

      <View className="px-gutter pt-safe-top">
        <FlowHeader
          step="capture"
          tone="dark"
          action="close"
          actionLabel="Cancel adding voucher"
          onAction={onClose}
          right={
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Flash"
              accessibilityState={{ checked: flash, disabled: !showCamera }}
              disabled={!showCamera}
              onPress={() => setFlash((f) => !f)}
              className={`h-11 w-11 items-center justify-center rounded-pill ${flash ? 'bg-paper' : 'bg-paper/10'} ${showCamera ? '' : 'opacity-40'}`}
            >
              {flash ? (
                <Zap size={20} color={colors.action} strokeWidth={2} />
              ) : (
                <ZapOff size={20} color={colors.paper} strokeWidth={2} />
              )}
            </Pressable>
          }
        />
      </View>

      <View className="flex-1 items-center justify-center">
        {showCamera ? (
          <View className="h-[380px] w-[300px]" pointerEvents="none">
            <View className={`${CORNER} left-0 top-0 rounded-tl-card border-l-[3px] border-t-[3px]`} />
            <View className={`${CORNER} right-0 top-0 rounded-tr-card border-r-[3px] border-t-[3px]`} />
            <View className={`${CORNER} bottom-0 left-0 rounded-bl-card border-b-[3px] border-l-[3px]`} />
            <View className={`${CORNER} bottom-0 right-0 rounded-br-card border-b-[3px] border-r-[3px]`} />
          </View>
        ) : (
          <CameraUnavailable
            loading={permission === null}
            error={cameraError}
            canAsk={permission?.canAskAgain ?? true}
            onRequest={requestPermission}
          />
        )}
        {showCamera ? (
          <View className="mt-6 h-8 justify-center rounded-pill bg-paper/10 px-3.5">
            <Text accessibilityLiveRegion="polite" className="font-body text-caption text-paper">
              {captureFailed ? "Couldn't take the photo. Try again." : 'Fit the whole voucher inside the frame'}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between px-7 pb-11">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick from library"
          onPress={pickFromLibrary}
          disabled={taking}
          className="w-[76px] items-center gap-1.5"
        >
          <View className="h-[52px] w-[52px] items-center justify-center rounded-card bg-paper/10">
            <ImageIcon size={22} color={colors.paper} strokeWidth={2} />
          </View>
          <Text className="font-body text-[12px] text-paper/75">Library</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          accessibilityState={{ disabled: !ready || taking, busy: taking }}
          onPress={takePhoto}
          disabled={!showCamera || !ready || taking}
          className={`h-20 w-20 items-center justify-center rounded-pill border-4 border-paper ${showCamera && ready ? '' : 'opacity-40'}`}
        >
          {taking ? (
            <ActivityIndicator color={colors.paper} />
          ) : (
            <View className="h-16 w-16 rounded-pill bg-paper active:opacity-80" />
          )}
        </Pressable>

        <View className="w-[76px]" />
      </View>
    </View>
  );
}

interface CameraUnavailableProps {
  loading: boolean;
  error: string | null;
  canAsk: boolean;
  onRequest: () => void;
}

/** Shown in the viewfinder while permission is pending or denied, or when there's no camera (the Simulator). */
function CameraUnavailable({ loading, error, canAsk, onRequest }: CameraUnavailableProps) {
  if (loading) return <ActivityIndicator color={colors.paper} accessibilityLabel="Checking camera access" />;

  const title = error ? 'Camera unavailable' : 'Allow camera access';
  const body = error
    ? 'Pick a photo of the voucher from your library instead.'
    : canAsk
      ? 'Clippr reads vouchers on this phone. Photos never leave it.'
      : 'Camera access is off for Clippr. Turn it on in Settings, or pick a photo from your library.';

  return (
    <View className="mx-gutter items-center gap-3 rounded-panel bg-paper/10 px-7 py-8">
      <Camera size={28} color={colors.paper} strokeWidth={1.8} />
      <Text className="text-center font-display text-title text-paper">{title}</Text>
      <Text className="text-center font-body text-body-sm text-paper/75">{body}</Text>
      {error ? null : (
        <Pressable
          accessibilityRole="button"
          onPress={canAsk ? onRequest : () => Linking.openSettings()}
          className="mt-2 h-11 justify-center rounded-pill bg-paper px-5 active:opacity-90"
        >
          <Text className="font-display text-body-sm text-action">{canAsk ? 'Allow camera' : 'Open Settings'}</Text>
        </Pressable>
      )}
    </View>
  );
}
