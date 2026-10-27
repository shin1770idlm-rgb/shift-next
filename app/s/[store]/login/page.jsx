import { notFound } from 'next/navigation';
import LoginForm from './LoginForm';
import { getStore } from '../../../../lib/stores';
export default async function Page({ params }) {
  const { store } = await params, s = await getStore(store);
  if (!s) notFound();
  return <LoginForm store={store} name={s.name} />;
}
