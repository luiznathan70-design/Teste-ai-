/** Mapa do Google sem chave de API, a partir do endereço */
export function MapEmbed({ address, className }: { address: string; className?: string }) {
  return (
    <iframe
      title="Localização da Ranchos Pizzaria"
      src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`}
      className={className ?? "h-72 w-full rounded-2xl border-0"}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
