import { HostLayout } from '@/shared/components/HostLayout';
import { LockTimer } from '@/shared/components/LockTimer';
import { useGameState } from '@/context/GameContext';
import v4RoofBg from '@/assets/backgrounds/v4roof.png';

export function QuestionView() {
  const { currentQuestion, timeRemaining, timerDuration } = useGameState();
  const answerRowStyles = [
    { rotate: 3, offsetX: 0 },
    { rotate: 1, offsetX: -18 },
    { rotate: -1, offsetX: 12 },
    { rotate: -2, offsetX: -8 },
  ];

  if (!currentQuestion) return null;

  return (
    <HostLayout backgroundImage={v4RoofBg} minimalSettingsGear>
      <div className="flex-1 relative flex flex-row min-h-0">
        <section className="w-1/2 h-full shrink-0 flex items-center justify-center px-6 md:px-10">
          <div className="w-4/5 max-w-full flex flex-col items-center text-center gap-4">
            <p className="font-tradeWinds text-xl md:text-2xl lg:text-3xl question-numbering question-prompt">
              CS51: Abstraction
            </p>
            <p className="font-newspaper text-3xl md:text-4xl lg:text-5xl leading-tight question-copy question-prompt">
              {currentQuestion.question}
            </p>
          </div>
        </section>

        <section className="w-1/2 h-full shrink-0 flex flex-col items-center justify-center gap-3 md:gap-4 px-6 md:px-10">
          <div className="w-full max-w-xl translate-x-6 translate-y-1/2 md:translate-x-8 md:translate-y-1/2 flex flex-col gap-8 md:gap-9">
            {currentQuestion.choices.map((choice, i) => (
              <div
                key={i}
                className="font-newspaper text-lg md:text-xl lg:text-2xl question-copy flex items-baseline gap-3 md:gap-4"
                style={{
                  transform: `translateX(${answerRowStyles[i % answerRowStyles.length].offsetX}px) rotate(${answerRowStyles[i % answerRowStyles.length].rotate}deg)`,
                  transformOrigin: 'left center',
                }}
              >
                <span
                  className="shrink-0 inline-block w-8 md:w-10 text-[#fde047] text-[1.6em] leading-none"
                >
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className="flex-1">{choice}</span>
              </div>
            ))}
          </div>
        </section>

        <div
          className="absolute z-10"
          style={{
            top: 0,
            left: 0,
          }}
        >
          <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left' }}>
            <LockTimer timeRemaining={timeRemaining} totalTime={timerDuration} size={200} />
          </div>
        </div>
      </div>
    </HostLayout>
  );
}
