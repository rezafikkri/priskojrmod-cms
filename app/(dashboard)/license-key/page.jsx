import LicenseKeysTable from '@/components/license-key/license-keys-table';

export const metadata = {
  title: 'License Keys',
};

export default async function LicenseKeyListPage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">License Keys</h1>
      <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">Used to activate and validate access to the application.</h2>
      
      <LicenseKeysTable />
    </>
  );
}
