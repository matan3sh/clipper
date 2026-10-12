import { format, parseISO } from 'date-fns';
import { Image } from 'expo-image';
import { Check } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Button } from '@/components/Button';
import { FlowHeader } from '@/components/add-voucher/FlowHeader';
import type { AnalysisState } from '@/hooks/useVoucherDraft';
import { formatMoney } from '@/lib/format';
import type { Analysis } from '@/lib/mlkit';
import type { PreparedPhoto } from '@/lib/photos';
import { colors } from '@/lib/theme';
import { QUALITY_LABELS, qualityTier } from '@/types/voucher';

interface AnalyzeStepProps {
  photo: PreparedPhoto | null;
  analysis: AnalysisState;
  onRetake: () => void;
  onContinue: () => void;
}

/** Step 2: ML Kit reads the photo; shows the quality score and the fields it found. */
export function AnalyzeStep({ photo, analysis, onRetake, onContinue }: AnalyzeStepProps) {
  const result = analysis.status === 'done' ? analysis.result : null;
  const rescan = result ? qualityTier(result.quality) === 'rescan' : false;

  return (
    <View className="flex-1 bg-paper">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-gutter pb-6 pt-safe-top">
        <FlowHeader step="analyze" action="back" actionLabel="Back to camera" onAction={onRetake} />
        <PhotoPanel photo={photo} highlights={result?.highlights ?? []} />

        {analysis.status === 'running' ? (
          <View className="h-[132px] flex-row items-center justify-center gap-3 rounded-card bg-surface">
            <ActivityIndicator color={colors.action} />
            <Text className="font-body text-body text-muted">Reading your voucher…</Text>
          </View>
        ) : null}

        {analysis.status === 'failed' ? (
          <View className="gap-1 rounded-card bg-danger-wash p-4">
            <Text className="font-display text-body text-danger">
              {photo ? "Couldn't read this photo" : "Couldn't open this photo"}
            </Text>
            <Text className="font-body text-caption text-ink">
              {photo
                ? 'Try another photo, or continue and type the details yourself.'
                : 'Try taking the photo again or pick a different one.'}
            </Text>
          </View>
        ) : null}

        {result ? (
          <>
            <ScoreCard result={result} />
            <FoundFields result={result} />
          </>
        ) : null}
      </ScrollView>

      <View className="flex-row gap-2.5 px-gutter pb-[34px] pt-3">
        <Button label="Retake" variant="outline" onPress={onRetake} />
        <Button
          label={analysis.status === 'failed' ? 'Type details' : rescan ? 'Use anyway' : 'Continue'}
          onPress={onContinue}
          disabled={analysis.status === 'running' || !photo}
          grow
        />
      </View>
    </View>
  );
}

const PHOTO_WIDTH = 150;

/** The captured photo, tilted like paper, with the text ML Kit used outlined in Iris. */
function PhotoPanel({ photo, highlights }: { photo: PreparedPhoto | null; highlights: Analysis['highlights'] }) {
  const scale = photo ? PHOTO_WIDTH / photo.width : 1;
  return (
    <View className="h-[150px] overflow-hidden rounded-image bg-surface">
      {/* Keyed so the paper card mounts fresh: reusing the spinner's View would add shadow-paper
          after first render, which NativeWind v4 handles by remounting (see CLAUDE.md). */}
      {photo ? (
        <View
          key="photo"
          className="absolute left-1/2 top-[22px] overflow-hidden rounded-lg bg-paper shadow-paper"
          style={{
            width: PHOTO_WIDTH,
            height: photo.height * scale,
            marginLeft: -PHOTO_WIDTH / 2,
            transform: [{ rotate: '-3deg' }],
          }}
          accessibilityRole="image"
          accessibilityLabel="Captured photo of the voucher, with detected text highlighted"
        >
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          {highlights.map((r, i) => (
            <View
              key={i}
              className="absolute rounded border border-accent bg-accent/15"
              style={{
                left: r.left * scale - 2,
                top: r.top * scale - 2,
                width: (r.right - r.left) * scale + 4,
                height: (r.bottom - r.top) * scale + 4,
              }}
            />
          ))}
        </View>
      ) : (
        <View key="loading" className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.action} />
        </View>
      )}
      <View className="absolute bottom-3 left-3 h-[26px] flex-row items-center gap-1.5 rounded-pill bg-paper px-2.5">
        <View className="h-1.5 w-1.5 rounded-pill bg-accent" />
        <Text className="font-display text-[12px] text-ink">ML Kit · on-device</Text>
      </View>
    </View>
  );
}

const RING_RADIUS = 24;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function ScoreCard({ result }: { result: Analysis }) {
  const tier = qualityTier(result.quality);
  const rescan = tier === 'rescan';
  const bars = [
    { label: 'Sharp', value: result.breakdown.sharp },
    { label: 'Frame', value: result.breakdown.frame },
    { label: 'Text', value: result.breakdown.text },
  ];

  return (
    <View className="gap-3.5 rounded-card bg-surface p-4">
      <View className="flex-row items-center gap-3.5">
        <View className="h-14 w-14 items-center justify-center">
          <Svg width={56} height={56} viewBox="0 0 56 56" style={{ position: 'absolute' }}>
            <Circle cx={28} cy={28} r={RING_RADIUS} fill={colors.paper} stroke={colors.hairline} strokeWidth={5} />
            <Circle
              cx={28}
              cy={28}
              r={RING_RADIUS}
              fill="none"
              stroke={rescan ? colors.danger : colors.accent}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${(RING_LENGTH * result.quality) / 100} ${RING_LENGTH}`}
              transform="rotate(-90 28 28)"
            />
          </Svg>
          <Text className="font-display text-[18px] tracking-[-0.54px] text-ink">{result.quality}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-display text-eyebrow uppercase text-accent-ink">Quality score</Text>
          <Text className={`font-display text-[18px] tracking-[-0.54px] ${rescan ? 'text-danger' : 'text-ink'}`}>
            {QUALITY_LABELS[tier]}
          </Text>
          <Text className="font-body text-caption text-muted">
            {rescan
              ? 'Some details may be hard to read. Try more light and fill the frame.'
              : 'Clear enough to show at checkout'}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        {bars.map((bar) => (
          <View key={bar.label} className="flex-1 gap-1.5" accessible accessibilityLabel={`${bar.label} ${bar.value} of 100`}>
            <View className="flex-row justify-between">
              <Text className="font-body text-[12px] text-muted">{bar.label}</Text>
              <Text className="font-display text-[12px] text-ink">{bar.value}</Text>
            </View>
            <View className="h-1 rounded-pill bg-hairline">
              <View className="h-1 rounded-pill bg-ink" style={{ width: `${bar.value}%` }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function FoundFields({ result }: { result: Analysis }) {
  const { storeName, amount, currency, expiryDate } = result.suggestions;
  const rows = [
    { label: 'Store', value: storeName },
    {
      label: 'Amount',
      value: amount !== null ? (currency ? `${formatMoney(amount, currency)} ${currency}` : amount.toFixed(2)) : null,
    },
    { label: 'Expiry', value: expiryDate ? format(parseISO(expiryDate), 'd MMM yyyy') : null },
  ];

  return (
    <View>
      <Text className="mb-0.5 font-body text-caption text-muted">Found in the photo</Text>
      {rows.map((row, i) => (
        <View
          key={row.label}
          className={`h-11 flex-row items-center gap-2.5 ${i < rows.length - 1 ? 'border-b border-divider' : ''}`}
          accessible
          accessibilityLabel={`${row.label}: ${row.value ?? 'not found'}`}
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded-pill ${row.value ? 'bg-accent' : 'border-[1.5px] border-border'}`}
          >
            {row.value ? <Check size={11} color={colors.paper} strokeWidth={3.5} /> : null}
          </View>
          <Text className="flex-1 font-body text-[15px] text-muted">{row.label}</Text>
          <Text
            numberOfLines={1}
            className={`max-w-[60%] text-[15px] ${row.value ? 'font-display text-ink' : 'font-body text-faint'}`}
          >
            {row.value ?? 'Not found'}
          </Text>
        </View>
      ))}
    </View>
  );
}
