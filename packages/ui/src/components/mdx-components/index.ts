// Import all components once
import { Callout } from './common/Callout'
import { ImageGallery } from './common/ImageGallery'
import { Video } from './common/Video'
import { Timeline } from './hackathon/Timeline'
import { PrizeTable } from './hackathon/PrizeTable'
import { SponsorGrid } from './hackathon/SponsorGrid'
import { TechStack } from './proposal/TechStack'
import { DemoEmbed } from './proposal/DemoEmbed'
import { TeamRoles } from './proposal/TeamRoles'
import { ProjectShowcase } from './profile/ProjectShowcase'
import { SkillBadges } from './profile/SkillBadges'

// Named re-exports
export { Callout, ImageGallery, Video, Timeline, PrizeTable, SponsorGrid, TechStack, DemoEmbed, TeamRoles, ProjectShowcase, SkillBadges }

// Scene-grouped component maps for MDX rendering
export const commonComponents = { Callout, ImageGallery, Video }
export const hackathonComponents = { ...commonComponents, Timeline, PrizeTable, SponsorGrid }
export const proposalComponents = { ...commonComponents, TechStack, DemoEmbed, TeamRoles }
export const profileComponents = { ...commonComponents, ProjectShowcase, SkillBadges }
