const destinations = [
  { destination: "Rio de Janeiro", price: 1299, image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80", duration: "4 dias", provider: "Viagem Teste" },
  { destination: "São Paulo", price: 899, image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80", duration: "3 dias", provider: "Viagem Teste" },
  { destination: "Salvador", price: 1499, image: "https://images.unsplash.com/photo-1518639192441-8fce7f7d4f0c?auto=format&fit=crop&w=1200&q=80", duration: "5 dias", provider: "Viagem Teste" },
  { destination: "Recife", price: 1399, image: "https://images.unsplash.com/photo-1519302959554-a75be0afc82e?auto=format&fit=crop&w=1200&q=80", duration: "4 dias", provider: "Viagem Teste" },
  { destination: "Fortaleza", price: 1599, image: "https://images.unsplash.com/photo-1502920917128-1aa500764b71?auto=format&fit=crop&w=1200&q=80", duration: "5 dias", provider: "Viagem Teste" },
];

function searchTrips(query) {
  const q = String(query || "").trim().toLowerCase();
  return destinations.filter((item) => {
    if (!q) return true;
    return item.destination.toLowerCase().includes(q);
  });
}

export default {
  searchTrips,
};
