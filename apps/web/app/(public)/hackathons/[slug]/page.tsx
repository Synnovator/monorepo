import { notFound } from 'next/navigation';
import { getHackathon, listHackathons, listSubmissions, listProfiles, getTeamsByHackathon } from '@/app/_generated/data';
import { t, localize, getCurrentStage, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Timeline } from '@/components/Timeline';
import { TrackSection } from '@/components/TrackSection';
import { JudgeCard } from '@/components/JudgeCard';
import { EventCalendar } from '@/components/EventCalendar';
import { ProjectCard } from '@/components/ProjectCard';
import { GitHubRedirect } from '@/components/GitHubRedirect';
import { HackathonTabs } from '@/components/HackathonTabs';
import { FAQAccordion } from '@/components/FAQAccordion';
import { ScoreCard } from '@/components/ScoreCard';
import { DatasetSection } from '@/components/DatasetSection';
import { ClipboardListIcon, ShieldCheckIcon } from '@/components/icons';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { NDASignForm } from '@/components/forms/NDASignForm';
import { AppealForm } from '@/components/forms/AppealForm';
import { TeamsTab } from '@/components/TeamsTab';
import { SketchUnderline, SketchDoodle } from '@/components/sketch';
import { EditHackathonButton } from '@/components/EditHackathonButton';
import { Separator, Badge } from '@synnovator/ui';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return listHackathons().map(h => ({ slug: h.hackathon.slug }));
}

function typeVariant(type: string): 'brand' | 'info' | 'highlight' {
  switch (type) {
    case 'enterprise': return 'info';
    case 'youth-league': return 'highlight';
    default: return 'brand';
  }
}

type StageVariant = 'secondary' | 'brand' | 'highlight' | 'info' | 'warning';

function stageVariant(stage: string): StageVariant {
  switch (stage) {
    case 'registration': return 'brand';
    case 'development':
    case 'submission': return 'highlight';
    case 'judging': return 'info';
    case 'announcement':
    case 'award': return 'warning';
    default: return 'secondary';
  }
}

export default async function HackathonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  const entry = getHackathon(slug);
  if (!entry) notFound();

  const h = entry.hackathon;
  const stage = h.timeline ? getCurrentStage(h.timeline) : 'draft';

  // Load submissions
  const allSubmissions = listSubmissions();
  const submissions = allSubmissions.filter(s => s._hackathonSlug === slug);

  // Load results (embedded in hackathon data or separate)
  const showLeaderboard = ['announcement', 'award', 'ended'].includes(stage);

  const formTracks = (h.tracks ?? []).map((tr: any) => ({
    slug: tr.slug,
    name: tr.name,
    name_zh: tr.name_zh,
  }));

  // Track name map
  const trackNameMap: Record<string, { name: string; name_zh?: string }> = {};
  for (const track of (h.tracks || [])) {
    trackNameMap[track.slug] = { name: track.name, name_zh: track.name_zh };
  }

  // Collect unique tracks from submissions for filter pills
  const submissionTracks = [...new Set(submissions.map(s => s.project.track))];

  // Build github → profile slug map for judge links
  const profiles = listProfiles();
  const githubToProfile = new Map<string, string>();
  for (const p of profiles) {
    if (p.hacker.github) {
      githubToProfile.set(p.hacker.github, p.hacker.github);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-hackathon={h.slug}>

      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={typeVariant(h.type)}>
            {t(lang, `hackathon.type_${h.type.replace('-', '_')}`)}
          </Badge>
          <Badge variant={stageVariant(stage)}>
            {t(lang, `stage.${stage}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground">
            {localize(lang, h.name, h.name_zh)}
          </h1>
          <EditHackathonButton
            slug={h.slug}
            organizers={(h.organizers ?? []).map((o: any) => o.github).filter(Boolean)}
            lang={lang}
          />
        </div>

        <p className="text-lg text-muted-foreground max-w-3xl mb-6">
          {localize(lang, h.tagline, h.tagline_zh)}
        </p>

        <div className="flex flex-wrap gap-3">
          {stage === 'registration' && (
            <div className="relative inline-block">
              <a href="#register-section" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
                {t(lang, 'hackathon.register')}
              </a>
              <SketchUnderline className="absolute -bottom-2 left-0" width={120} delay={400} />
            </div>
          )}
          {stage === 'submission' && (
            <GitHubRedirect action="submit" hackathonSlug={h.slug} label={t(lang, 'hackathon.submit')} className="bg-primary text-primary-foreground hover:bg-primary/80" />
          )}
          {['announcement', 'award', 'ended'].includes(stage) && (
            <a href="#leaderboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
              {t(lang, 'hackathon.results')}
            </a>
          )}
          {stage === 'announcement' && (
            <a href="#appeal-section" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
              {t(lang, 'hackathon.appeal')}
            </a>
          )}
          {h.legal?.nda?.required && (
            <Badge variant="warning">
              {t(lang, 'hackathon.nda_warning')}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content with Tabs (2/3) */}
        <div className="lg:col-span-2">
          <HackathonTabs
            detailsLabel={t(lang, 'tab.details')}
            submissionsLabel={t(lang, 'tab.submissions')}
            leaderboardLabel={t(lang, 'tab.leaderboard')}
            teamsLabel={t(lang, 'tab.teams')}
          />

          {/* Tab 1: Details */}
          <div data-tab-panel="details" role="tabpanel" id="panel-details" aria-labelledby="tab-details">
            <div className="pt-6">
              <section className="mb-12">
                <div className="prose prose-sm max-w-none text-foreground">
                  <p>{localize(lang, h.description, h.description_zh)}</p>
                </div>
              </section>

              {h.organizers && h.organizers.length > 0 && (
                <>
                  <Separator />
                  <section className="mt-12 mb-12">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.organizers')}</h2>
                    <div className="flex flex-wrap gap-4">
                      {h.organizers.map((org: { name?: string; name_zh?: string; role?: string }, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="text-foreground text-sm font-medium">{localize(lang, org.name, org.name_zh)}</p>
                            {org.role && <p className="text-muted-foreground text-xs">{org.role}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {h.tracks && h.tracks.length > 0 && (
                <>
                  <Separator />
                  <section className="mt-12 mb-12">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.tracks')}</h2>
                    <div className="space-y-6">
                      {h.tracks.map((track: any) => (
                        <TrackSection key={track.slug} track={track} lang={lang} />
                      ))}
                    </div>
                  </section>
                </>
              )}

              {h.eligibility && (
                <>
                  <Separator />
                  <section className="mt-12 mb-8">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <ClipboardListIcon size={22} className="shrink-0" aria-hidden="true" />
                      {t(lang, 'hackathon.eligibility')}
                    </h2>
                    <div className="space-y-3">
                      {h.eligibility.team_size && (
                        <p className="text-sm text-foreground">
                          {t(lang, 'hackathon.team_size_label')}: {h.eligibility.team_size.min}–{h.eligibility.team_size.max}
                          {h.eligibility.allow_solo && ` ${t(lang, 'hackathon.solo_allowed')}`}
                        </p>
                      )}
                      {h.eligibility.restrictions?.map((r: string, i: number) => (
                        <p key={i} className="text-sm text-muted-foreground">{r}</p>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {h.datasets && h.datasets.length > 0 && (
                <>
                <Separator />
                <section className="mt-12 mb-8">
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.datasets')}</h2>
                  <DatasetSection datasets={h.datasets as any} hackathonSlug={h.slug} lang={lang} />
                </section>
                </>
              )}

              {h.legal && (
                <>
                <Separator />
                <section className="mt-12 mb-8">
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                    <ShieldCheckIcon size={22} className="shrink-0" aria-hidden="true" />
                    {t(lang, 'hackathon.legal')}
                  </h2>
                  <div className="space-y-3">
                    {h.legal.license && <p className="text-sm text-foreground">{t(lang, 'hackathon.license_label')}: {h.legal.license}</p>}
                    {h.legal.ip_ownership && <p className="text-sm text-foreground">{t(lang, 'hackathon.ip_label')}: {h.legal.ip_ownership}</p>}
                    {h.legal.compliance_notes?.map((note: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground">{note}</p>
                    ))}
                  </div>
                </section>
                </>
              )}

              {h.faq && h.faq.length > 0 && (
                <>
                  <Separator />
                  <section className="mt-12 mb-12">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.faq')}</h2>
                    <FAQAccordion items={h.faq} lang={lang} />
                  </section>
                </>
              )}

              {stage === 'judging' && h.tracks?.map((track: any) => (
                track.judging?.criteria && track.judging.criteria.length > 0 && (
                  <section key={track.slug} className="mt-12 mb-8">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-4">
                      {t(lang, 'score.title')} — {localize(lang, track.name, track.name_zh)}
                    </h2>
                    <ScoreCard hackathonSlug={h.slug} trackSlug={track.slug} criteria={track.judging.criteria} lang={lang} />
                  </section>
                )
              ))}

              {/* NDA Sign Form */}
              {h.legal?.nda?.required && (
                <section className="mt-12">
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">
                    {t(lang, 'hackathon.nda_sign')}
                  </h2>
                  <NDASignForm
                    hackathonSlug={h.slug}
                    ndaDocumentUrl={h.legal.nda.document_url}
                    ndaSummary={h.legal.nda.summary}
                    lang={lang}
                  />
                </section>
              )}

              {/* Register Form (during registration stage) */}
              {stage === 'registration' && (
                <section id="register-section" className="mt-12">
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.register')}</h2>
                  <RegisterForm
                    hackathonSlug={h.slug}
                    hackathonName={localize(lang, h.name, h.name_zh)}
                    tracks={formTracks}
                    ndaRequired={!!h.legal?.nda?.required}
                    lang={lang}
                  />
                </section>
              )}

              {/* Appeal Form (during announcement stage) */}
              {stage === 'announcement' && (
                <section id="appeal-section" className="mt-12">
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.appeal')}</h2>
                  <AppealForm
                    hackathonSlug={h.slug}
                    tracks={formTracks}
                    teams={[]}
                    lang={lang}
                  />
                </section>
              )}
            </div>
          </div>

          {/* Tab 2: Submissions */}
          <div data-tab-panel="submissions" role="tabpanel" id="panel-submissions" aria-labelledby="tab-submissions" className="hidden">
            <div className="space-y-6 pt-6">
              {submissionTracks.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary/20 text-primary cursor-pointer">
                    {t(lang, 'project.filter_all')}
                  </span>
                  {submissionTracks.map(trackSlug => (
                    <span key={trackSlug} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      {trackNameMap[trackSlug] ? localize(lang, trackNameMap[trackSlug].name, trackNameMap[trackSlug].name_zh) : trackSlug}
                    </span>
                  ))}
                </div>
              )}

              {submissions.length === 0 ? (
                <div className="rounded-lg bg-muted/30 p-12 text-center">
                  <SketchDoodle variant="question" className="mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">{t(lang, 'project.no_submissions')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.map(sub => (
                    <ProjectCard
                      key={sub._teamSlug}
                      project={sub.project}
                      hackathonSlug={slug}
                      teamSlug={sub._teamSlug}
                      lang={lang}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab 3: Leaderboard */}
          <div data-tab-panel="leaderboard" role="tabpanel" id="panel-leaderboard" aria-labelledby="tab-leaderboard" className="hidden">
            <div className="space-y-8 pt-6">
              {!showLeaderboard ? (
                <div className="rounded-lg bg-muted/30 p-12 text-center">
                  <p className="text-muted-foreground text-lg">{t(lang, 'project.leaderboard_pending')}</p>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/30 p-12 text-center">
                  <p className="text-muted-foreground text-lg">{t(lang, 'result.pending')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tab 4: Teams */}
          <div data-tab-panel="teams" role="tabpanel" id="panel-teams" aria-labelledby="tab-teams" className="hidden">
            <div className="space-y-8 pt-6">
              <TeamsTab hackathonSlug={h.slug} lang={lang} teams={getTeamsByHackathon(h.slug)} />
            </div>
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <aside className="space-y-8">
          {h.timeline && (
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.timeline')}</h2>
              <Timeline timeline={h.timeline} lang={lang} />
            </section>
          )}

          {h.events && h.events.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.events')}</h2>
              <EventCalendar events={h.events} lang={lang} />
            </section>
          )}

          {h.judges && h.judges.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-4">{t(lang, 'hackathon.judges')}</h2>
              <div className="space-y-3">
                {h.judges.map((judge: any) => (
                  <JudgeCard key={judge.github} judge={judge} lang={lang} profileSlug={githubToProfile.get(judge.github)} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
