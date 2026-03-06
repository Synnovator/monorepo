import Link from 'next/link';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { GuideTabBar } from '@/components/GuideTabBar';

function getSteps(lang: Lang) {
  return [
    {
      title: lang === 'zh' ? '创建活动仓库' : 'Create the Hackathon',
      content: lang === 'zh'
        ? '使用 GitHub Template Repo 创建活动目录，或在 hackathons/ 下手动创建以活动 slug 命名的目录。'
        : 'Use the GitHub Template Repo to create the event directory, or manually create a directory under hackathons/ named with the event slug.',
    },
    {
      title: lang === 'zh' ? '配置 hackathon.yml' : 'Configure hackathon.yml',
      content: lang === 'zh'
        ? '编辑 hackathon.yml，配置赛道（tracks）、时间线（timeline）、奖项（rewards）、参赛资格（eligibility）等核心信息。所有字段均支持中英双语。'
        : 'Edit hackathon.yml to configure tracks, timeline, rewards, eligibility, and other core information. All fields support bilingual (EN/ZH) content.',
    },
    {
      title: lang === 'zh' ? '提交 PR 注册活动' : 'Submit PR to Register',
      content: lang === 'zh'
        ? '将活动目录通过 PR 提交到主仓库。GitHub Actions 会自动校验 YAML Schema，通过后等待管理员审核合并。'
        : 'Submit the event directory via PR to the main repo. GitHub Actions will auto-validate the YAML schema. Wait for admin review and merge.',
    },
    {
      title: lang === 'zh' ? '管理报名与提交' : 'Manage Registrations & Submissions',
      content: lang === 'zh'
        ? '通过 Issue 标签管理参赛者报名和项目提交。GitHub Actions 自动处理 Issue 路由，按阶段自动更新活动状态。'
        : 'Manage participant registrations and project submissions via Issue labels. GitHub Actions auto-route issues and update event status by phase.',
    },
    {
      title: lang === 'zh' ? '配置评委与评审' : 'Configure Judges & Review Scores',
      content: lang === 'zh'
        ? '在 hackathon.yml 中添加评委信息，配置评审标准和权重。评审阶段，评委通过评分卡提交分数，系统自动汇总。'
        : 'Add judge information in hackathon.yml, configure judging criteria and weights. During the judging phase, judges submit scores via the Score Card, and the system auto-aggregates results.',
    },
  ];
}

export default async function OrganizerGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));
  const steps = getSteps(lang);

  return (
    <>
      <GuideTabBar activeRole="organizer" lang={lang} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
            {t(lang, 'guide.organizer_title')}
          </h1>
          <p className="text-lg text-muted">{t(lang, 'guide.organizer_subtitle')}</p>
        </div>

        <div className="space-y-8">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-lime-primary/20 text-lime-primary flex items-center justify-center font-heading font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-white font-heading font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-light-gray text-sm leading-relaxed">{step.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-secondary-bg">
          <Link href="/guides" className="text-lime-primary hover:underline text-sm">
            &larr; {t(lang, 'guide.back_to_guides')}
          </Link>
        </div>
      </div>
    </>
  );
}
