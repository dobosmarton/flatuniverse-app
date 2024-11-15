import { AppSidebar } from '@/components/sidebar';

export default async function CookiePolicyLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-row">
      <AppSidebar />
      {props.children}
    </div>
  );
}
