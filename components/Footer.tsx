export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-2)] mt-12 pb-16 lg:pb-0">
      <div className="max-w-[1400px] mx-auto px-4 py-7 text-[13px] text-[var(--fg-3)] leading-relaxed">
        본 서비스는 AI 알고리즘의 매매 판단을 관찰하는 교육 플랫폼입니다.
        투자 추천이 아니며, 표시되는 매매내역은 페이퍼 트레이딩(가상 잔고)
        결과입니다. 실제 투자에 따른 손익의 책임은 본인에게 있습니다.
      </div>
    </footer>
  );
}
