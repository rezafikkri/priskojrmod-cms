const formatter = new Intl.NumberFormat(process.env.NEXT_PUBLIC_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatFileSize(size) {
  const gb = size / (1024 ** 3);
  if (gb >= 1) {
    // then return size in GB
    return `${formatter.format(gb)} GB`;
  }

  const mb = size / (1024 ** 2);
  if (mb >= 1) {
    // then return size in MB
    return `${formatter.format(mb)} MB`;
  }

  const kb = size / 1024;
  return `${formatter.format(kb)} KB`;
}
