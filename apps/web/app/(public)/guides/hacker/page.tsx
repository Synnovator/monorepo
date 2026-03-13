import Link from 'next/link';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { GuideTabBar } from '@/components/GuideTabBar';

function getSteps(lang: Lang) {
  return [
    {
      title: lang === 'zh' ? '注册 Profile' : 'Register Your Profile',
      content: lang === 'zh'
        ? '在 profiles/ 目录下创建 YAML 文件，填写 GitHub ID、技能、兴趣方向等信息。通过 PR 提交后，Actions 自动校验格式。'
        : 'Create a YAML file under profiles/ with your GitHub ID, skills, and interests. Submit via PR and Actions will auto-validate the format.',
    },
    {
      title: lang === 'zh' ? '浏览活动' : 'Browse Events',
      content: lang === 'zh'
        ? '访问首页查看所有活动，使用状态筛选（进行中、即将开始、已结束）和搜索功能找到感兴趣的活动。'
        : 'Visit the homepage to see all events. Use status filters (Active, Upcoming, Ended) and search to find events you are interested in.',
    },
    {
      title: lang === 'zh' ? '报名参赛' : 'Register for an Event',
      content: lang === 'zh'
        ? '在活动详情页点击"立即报名"按钮，系统会引导你到 GitHub Issue 模板。填写信息并提交 Issue，组织者审核后完成报名。'
        : 'Click "Register Now" on the event detail page. You will be guided to a GitHub Issue template. Fill in your info and submit the issue. The organizer will review your registration.',
    },
    {
      title: lang === 'zh' ? '组建团队' : 'Form a Team',
      content: lang === 'zh'
        ? '在"队伍"页面创建队伍或加入已有队伍。创建队伍会生成一个 PR，合并后即可在队伍详情页管理成员。'
        : 'Create a team or join an existing one on the Teams page. Creating a team generates a PR — once merged, you can manage members on the team detail page.',
    },
    {
      title: lang === 'zh' ? '提交项目' : 'Submit Your Project',
      content: lang === 'zh'
        ? '在提交阶段，点击"提交项目"按钮。按要求填写项目名称、技术栈、代码仓库链接和演示视频。提交后等待评审。'
        : 'During the submission phase, click "Submit Project". Fill in the project name, tech stack, repo link, and demo video as required. Wait for the judging phase after submission.',
    },
  ];
}

export default async function HackerGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));
  const steps = getSteps(lang);

  return (
    <>
      <GuideTabBar activeRole="hacker" lang={lang} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            {t(lang, 'guide.hacker_title')}
          </h1>
          <p className="text-lg text-muted-foreground">{t(lang, 'guide.hacker_subtitle')}</p>
        </div>

        <div className="space-y-8">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-heading font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-foreground font-heading font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-foreground text-sm leading-relaxed">{step.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/guides" className="text-primary hover:underline text-sm">
            &larr; {t(lang, 'guide.back_to_guides')}
          </Link>
        </div>
      </div>
    </>
  );
}
