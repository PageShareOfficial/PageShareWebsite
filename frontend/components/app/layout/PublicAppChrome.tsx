import UnauthSidebar from '@/components/app/layout/UnauthSidebar';

/** Layout widths: 800/875 (group), 600 (midrail) — see utils/core/layoutConstants. */

const outerClasses = [
  'min-h-screen w-full bg-black flex flex-col',
  'md:flex-row md:flex-nowrap md:justify-center md:min-w-0',
].join(' ');

const wrapperClasses = [
  'flex flex-col md:flex-row md:shrink-0',
  'md:max-w-[800px] lg:max-w-[875px] w-full md:w-auto',
].join(' ');

const midrailOuterClasses = [
  'flex-1 flex justify-center md:justify-start min-w-0',
  'md:flex-none md:w-[600px] md:min-w-[600px]',
].join(' ');

const midrailClasses = [
  'flex-1 flex flex-col min-w-0 w-full',
  'max-w-[600px] md:w-[600px] md:min-w-[600px]',
].join(' ');

/**
 * Signed-out app chrome: logo + Sign in / Sign up sidebar and the middle rail.
 * Pages render only their middle-column content, same as with the signed-in shell.
 */
export default function PublicAppChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={outerClasses}>
      <div className={wrapperClasses}>
        <UnauthSidebar />
        <div className={midrailOuterClasses}>
          <div className={midrailClasses}>{children}</div>
        </div>
      </div>
    </div>
  );
}
