import { notFound } from 'next/navigation';
import ShiftApp from '../../ShiftApp';
import { getStore } from '../../../lib/stores';
export default async function Page({ params }) {
  const { store } = await params, s = getStore(store);
  if (!s) notFound();
  return <ShiftApp store={store} name={s.name} />;
}
