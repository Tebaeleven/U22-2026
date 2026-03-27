import { HelpCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQ_ITEMS = [
  {
    question: "このサイトは何ですか？",
    answer: "ブロックベースのビジュアルプログラミングでゲームを作り、共有できるプラットフォームです。プログラミング初心者でも直感的にゲームを作ることができます。",
  },
  {
    question: "アカウントを作るのに費用はかかりますか？",
    answer: "いいえ、完全無料でアカウントを作成し、すべての機能を利用できます。",
  },
  {
    question: "どんなゲームが作れますか？",
    answer: "アクションゲーム、パズルゲーム、シューティングゲーム、アートプロジェクト、音楽アプリなど、様々な種類のインタラクティブ作品を作ることができます。",
  },
  {
    question: "作った作品を公開するには？",
    answer: "エディターで作品を完成させたら、「共有」ボタンを押すだけで公開できます。公開した作品は探索ページから誰でも見ることができます。",
  },
  {
    question: "他の人の作品をリミックスできますか？",
    answer: "はい！公開されている作品は「中を見る」ボタンからコードを閲覧でき、「リミックス」ボタンで自分のバージョンを作ることができます。元の作者へのクレジットは自動で表示されます。",
  },
  {
    question: "スタジオとは何ですか？",
    answer: "スタジオは、テーマに沿った作品をまとめるコレクション機能です。自分でスタジオを作って他のユーザーの作品を追加したり、他の人のスタジオにキュレーターとして参加することができます。",
  },
]

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-10">
        <HelpCircle className="size-12 mx-auto text-[#4d97ff] mb-4" />
        <h1 className="text-3xl font-bold">よくある質問</h1>
        <p className="mt-2 text-muted-foreground">
          GameEngine についての質問と回答
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
