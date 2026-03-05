import type { ComponentProps, FC } from 'react';

// Raw SVG imports (transformed to React components by vite-plugin-svgr)
import ActivitySvg from '@/assets/icons/activity.svg?react';
import BellSvg from '@/assets/icons/bell.svg?react';
import ClipboardListSvg from '@/assets/icons/clipboard-list.svg?react';
import CopySvg from '@/assets/icons/copy.svg?react';
import CpuSvg from '@/assets/icons/cpu.svg?react';
import CrownSvg from '@/assets/icons/crown.svg?react';
import FilePostSvg from '@/assets/icons/file-post.svg?react';
import FileTextSvg from '@/assets/icons/file-text.svg?react';
import FolderSvg from '@/assets/icons/folder.svg?react';
import GlobeSvg from '@/assets/icons/globe.svg?react';
import HeadsetSvg from '@/assets/icons/headset.svg?react';
import HeartDiamondSvg from '@/assets/icons/heart-diamond.svg?react';
import HexagonTriangleSvg from '@/assets/icons/hexagon-triangle.svg?react';
import ImageSvg from '@/assets/icons/image.svg?react';
import LightbulbSvg from '@/assets/icons/lightbulb.svg?react';
import LogOutSvg from '@/assets/icons/log-out.svg?react';
import LogoDarkSvg from '@/assets/icons/logo-dark.svg?react';
import LogoLightSvg from '@/assets/icons/logo-light.svg?react';
import MapPinSvg from '@/assets/icons/map-pin.svg?react';
import MessageSquareSvg from '@/assets/icons/message-square.svg?react';
import MonitorPlaySvg from '@/assets/icons/monitor-play.svg?react';
import OrbitSvg from '@/assets/icons/orbit.svg?react';
import RocketSvg from '@/assets/icons/rocket.svg?react';
import ShieldCheckSvg from '@/assets/icons/shield-check.svg?react';
import SparklesSvg from '@/assets/icons/sparkles.svg?react';
import TrashSvg from '@/assets/icons/trash.svg?react';
import TrophySvg from '@/assets/icons/trophy.svg?react';
import UfoSvg from '@/assets/icons/ufo.svg?react';
import UserCrownTransferSvg from '@/assets/icons/user-crown-transfer.svg?react';
import UserSwitchSvg from '@/assets/icons/user-switch.svg?react';
import VideoSvg from '@/assets/icons/video.svg?react';

export type IconProps = ComponentProps<'svg'> & { size?: number };

function withSize(SvgComponent: FC<ComponentProps<'svg'>>): FC<IconProps> {
  const Wrapped: FC<IconProps> = ({ size = 24, ...props }) => (
    <SvgComponent width={size} height={size} {...props} />
  );
  Wrapped.displayName = SvgComponent.displayName || SvgComponent.name;
  return Wrapped;
}

export const ActivityIcon = withSize(ActivitySvg);
export const BellIcon = withSize(BellSvg);
export const ClipboardListIcon = withSize(ClipboardListSvg);
export const CopyIcon = withSize(CopySvg);
export const CpuIcon = withSize(CpuSvg);
export const CrownIcon = withSize(CrownSvg);
export const FilePostIcon = withSize(FilePostSvg);
export const FileTextIcon = withSize(FileTextSvg);
export const FolderIcon = withSize(FolderSvg);
export const GlobeIcon = withSize(GlobeSvg);
export const HeadsetIcon = withSize(HeadsetSvg);
export const HeartDiamondIcon = withSize(HeartDiamondSvg);
export const HexagonTriangleIcon = withSize(HexagonTriangleSvg);
export const ImageIcon = withSize(ImageSvg);
export const LightbulbIcon = withSize(LightbulbSvg);
export const LogOutIcon = withSize(LogOutSvg);
export const LogoDark = withSize(LogoDarkSvg);
export const LogoLight = withSize(LogoLightSvg);
export const MapPinIcon = withSize(MapPinSvg);
export const MessageSquareIcon = withSize(MessageSquareSvg);
export const MonitorPlayIcon = withSize(MonitorPlaySvg);
export const OrbitIcon = withSize(OrbitSvg);
export const RocketIcon = withSize(RocketSvg);
export const ShieldCheckIcon = withSize(ShieldCheckSvg);
export const SparklesIcon = withSize(SparklesSvg);
export const TrashIcon = withSize(TrashSvg);
export const TrophyIcon = withSize(TrophySvg);
export const UfoIcon = withSize(UfoSvg);
export const UserCrownTransferIcon = withSize(UserCrownTransferSvg);
export const UserSwitchIcon = withSize(UserSwitchSvg);
export const VideoIcon = withSize(VideoSvg);
