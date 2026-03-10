import Link from 'next/link';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { GuideTabBar } from '@/components/GuideTabBar';

function getSteps(lang: Lang) {
  return [
    {
      title: lang === 'zh' ? '设置评委 Profile' : 'Set Up Judge Profile',
      content: lang === 'zh'
        ? '确保你的 GitHub Profile 已在 profiles/ 中注册。组织者会在 hackathon.yml 的 judges 字段中添加你的信息。'
        : 'Make sure your GitHub profile is registered under profiles/. The organizer will add your information to the judges field in hackathon.yml.',
    },
    {
      title: lang === 'zh' ? '查看分配的提交作品' : 'Review Assigned Submissions',
      content: lang === 'zh'
        ? '在评审阶段，访问活动详情页查看所有提交的项目。阅读项目代码仓库、演示视频和文档。'
        : 'During the judging phase, visit the event detail page to see all submitted projects. Review the project repo, demo video, and documentation.',
    },
    {
      title: lang === 'zh' ? '使用评分卡评分' : 'Use the Score Card',
      content: lang === 'zh'
        ? '在活动详情页找到评分卡组件，选择要评审的团队，按评审标准逐项打分，并填写评语。系统会自动计算加权总分。'
        : 'Find the Score Card component on the event detail page. Select the team to review, score each criterion, and add comments. The system auto-calculates the weighted total.',
    },
    {
      title: lang === 'zh' ? '提交评分' : 'Submit Scores',
      content: lang === 'zh'
        ? '点击"提交评分"按钮，系统会自动生成包含评分数据的 GitHub Issue。确认内容后提交 Issue 即可。'
        : 'Click "Submit Score" and the system will auto-generate a GitHub Issue with your scoring data. Review the content and submit the issue.',
    },
    {
      title: lang === 'zh' ? '声明利益冲突' : 'Declare Conflicts of Interest',
      content: lang === 'zh'
        ? '如果与某个团队存在利益冲突（如团队成员是你的学生或同事），请在评分前主动声明，并回避该团队的评审。'
        : 'If you have a conflict of interest with a team (e.g., team members are your students or colleagues), declare it before scoring and recuse yourself from reviewing that team.',
    },
  ];
}

export default async function JudgeGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));
  const steps = getSteps(lang);

  return (
    <>
      <GuideTabBar activeRole="judge" lang={lang} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white mb-3">
            {t(lang, 'guide.judge_title')}
          </h1>
          <p className="text-lg text-muted">{t(lang, 'guide.judge_subtitle')}</p>
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
