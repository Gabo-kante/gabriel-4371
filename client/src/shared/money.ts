const formatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export const formatCents = (cents: number) => formatter.format(cents / 100);