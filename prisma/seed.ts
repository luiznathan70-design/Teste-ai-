/**
 * Seed do banco: cardápio de exemplo realista para todas as frentes da
 * Ranchos Pizzaria, horários, bairros, cupons, promoções, depoimentos,
 * usuário admin de teste e alguns pedidos para o dashboard ter dados.
 *
 * Rodar: npm run db:seed   (apaga e recria os dados de exemplo)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Fotos do Unsplash (placeholders — troque pelas fotos reais do restaurante)
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
const IMG = {
  pizza1: u("1513104890138-7c749659a591"),
  pizza2: u("1565299624946-b28f40a0ae38"),
  margherita: u("1574071318508-1cdbab80d002"),
  pepperoni: u("1628840042765-356cda07504e"),
  pizza3: u("1604382354936-07c5d9983bd3"),
  pizza4: u("1571407970349-bc81e7e96d47"),
  pizza5: u("1590947132387-155cc02f3212"),
  burger1: u("1568901346375-23c9450c58cd"),
  burger2: u("1550547660-d9450f859349"),
  burger3: u("1571091718767-18b5b1457add"),
  burger4: u("1553979459-d2229ba7433b"),
  hotdog: u("1612392062631-94dd858cba88"),
  fries: u("1573080496219-bb080dd4f877"),
  steak: u("1544025162-d76694265947"),
  grill: u("1529692236671-f1f6cf9683ba"),
  skewers: u("1555939594-58d7cb561ad1"),
  meat: u("1603360946369-dc9bb6258143"),
  picanha: u("1600891964092-4316c288032e"),
  plate: u("1546069901-ba9599a7e63c"),
  lunch: u("1512621776951-a57141f2eefd"),
  food: u("1504674900247-0877df9cc836"),
  dessert: u("1551024601-bec78aea704b"),
  icecream: u("1563805042-7684c019e1cb"),
  pudding: u("1488477181946-6428a0291777"),
  cake: u("1578985545062-69928b1d9587"),
  drinks: u("1544145945-f90425340c7e"),
  soda: u("1622483767028-3f66f32aef97"),
  juice: u("1600271886742-f049cd451bba"),
  beer: u("1608270586620-248524c67de9"),
  water: u("1548839140-29a749e1cf4d"),
};

const r = (reais: number) => Math.round(reais * 100);

async function reset() {
  // Ordem respeita as chaves estrangeiras
  await db.orderStatusLog.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();
  await db.addon.deleteMany();
  await db.pizzaPrice.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.addonGroup.deleteMany();
  await db.crustPrice.deleteMany();
  await db.crust.deleteMany();
  await db.pizzaSize.deleteMany();
  await db.category.deleteMany();
  await db.dailyMenuItem.deleteMany();
  await db.dailyMenu.deleteMany();
  await db.neighborhood.deleteMany();
  await db.coupon.deleteMany();
  await db.promotion.deleteMany();
  await db.testimonial.deleteMany();
  await db.businessHour.deleteMany();
  await db.settings.deleteMany();
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  await reset();

  // ---------------------------------------------------------------- Configurações
  await db.settings.create({
    data: {
      id: 1,
      name: "Ranchos Pizzaria",
      slogan: "Sabor de rancho, feito com carinho",
      phone: "[TELEFONE]",
      whatsapp: "5500000000000", // TROCAR: DDI + DDD + número, só dígitos
      email: "contato@ranchospizzaria.com.br",
      address: "[ENDEREÇO]",
      city: "[CIDADE]",
      instagram: "ranchospizzaria",
      pixKey: "contato@ranchospizzaria.com.br", // TROCAR pela chave Pix real
      pixMerchant: "RANCHOS PIZZARIA",
      minOrder: r(30),
      prepTimeMin: 45,
      aboutText:
        "A Ranchos Pizzaria nasceu do sonho de uma família do interior que queria levar para a cidade o sabor da comida de fazenda: forno a lenha, carne na brasa e aquele almoço caseiro que lembra a casa da vó.\n\nHoje somos quatro cozinhas em uma só: a pizzaria de massa de longa fermentação, a lanchonete com hambúrgueres artesanais, o self-service do almoço com tempero caseiro e o churrasco feito na parrilla com carvão de eucalipto.\n\nTudo preparado com ingredientes selecionados, muito capricho e o jeitinho acolhedor de quem recebe as visitas na varanda do rancho.",
    },
  });

  // ---------------------------------------------------------------- Horários
  // Almoço e churrasco no almoço; pizzaria e lanches à noite. Segunda o almoço funciona, noite fechada.
  const hours: { sector: string; weekday: number; opensAt: string; closesAt: string }[] = [];
  for (let d = 0; d <= 6; d++) {
    hours.push({ sector: "ALMOCO", weekday: d, opensAt: "11:00", closesAt: "14:30" });
    hours.push({ sector: "CHURRASCO", weekday: d, opensAt: "11:00", closesAt: "15:00" });
    if (d === 5 || d === 6 || d === 0) hours.push({ sector: "CHURRASCO", weekday: d, opensAt: "18:00", closesAt: "22:00" });
    if (d !== 1) {
      hours.push({ sector: "PIZZARIA", weekday: d, opensAt: "18:00", closesAt: d === 5 || d === 6 ? "00:30" : "23:30" });
      hours.push({ sector: "LANCHES", weekday: d, opensAt: "18:00", closesAt: d === 5 || d === 6 ? "00:30" : "23:30" });
    }
    hours.push({ sector: "BEBIDAS", weekday: d, opensAt: "11:00", closesAt: "00:30" });
    hours.push({ sector: "SOBREMESAS", weekday: d, opensAt: "11:00", closesAt: "00:30" });
  }
  await db.businessHour.createMany({ data: hours });

  // ---------------------------------------------------------------- Categorias
  const catDefs = [
    { name: "Pizzas Salgadas", sector: "PIZZARIA" },
    { name: "Pizzas Doces", sector: "PIZZARIA" },
    { name: "Hambúrgueres", sector: "LANCHES" },
    { name: "Cachorro-Quente", sector: "LANCHES" },
    { name: "Porções", sector: "LANCHES" },
    { name: "Almoço", sector: "ALMOCO" },
    { name: "Churrasco", sector: "CHURRASCO" },
    { name: "Espetinhos", sector: "CHURRASCO" },
    { name: "Kits e Combos", sector: "CHURRASCO" },
    { name: "Bebidas", sector: "BEBIDAS" },
    { name: "Sobremesas", sector: "SOBREMESAS" },
  ];
  const cats: Record<string, number> = {};
  for (const [i, c] of catDefs.entries()) {
    const created = await db.category.create({ data: { ...c, slug: slugify(c.name), sortOrder: i } });
    cats[c.name] = created.id;
  }

  // ---------------------------------------------------------------- Pizza: tamanhos e bordas
  const sizeDefs = [
    { name: "Broto", slices: 4, maxFlavors: 1 },
    { name: "Média", slices: 6, maxFlavors: 2 },
    { name: "Grande", slices: 8, maxFlavors: 2 },
    { name: "Família", slices: 12, maxFlavors: 3 },
  ];
  const sizes: number[] = [];
  for (const [i, s] of sizeDefs.entries()) sizes.push((await db.pizzaSize.create({ data: { ...s, sortOrder: i } })).id);
  const [BROTO, MEDIA, GRANDE, FAMILIA] = sizes;

  const crustDefs: [string, number[]][] = [
    ["Catupiry", [6, 9, 12, 15]],
    ["Cheddar", [6, 9, 12, 15]],
    ["Cream cheese", [7, 10, 13, 16]],
    ["Chocolate", [7, 10, 13, 16]],
  ];
  for (const [name, prices] of crustDefs) {
    await db.crust.create({
      data: { name, prices: { create: sizes.map((sizeId, i) => ({ sizeId, price: r(prices[i]) })) } },
    });
  }

  // Preços por tamanho: [broto, média, grande, família]
  const pizza = async (
    category: string,
    name: string,
    description: string,
    prices: [number, number, number, number],
    image: string,
    extra: { featured?: boolean; tags?: string } = {},
  ) =>
    db.product.create({
      data: {
        name,
        slug: slugify(`pizza ${name}`),
        description,
        imageUrl: image,
        kind: "PIZZA",
        categoryId: cats[category],
        featured: extra.featured ?? false,
        tags: extra.tags ?? "",
        pizzaPrices: {
          create: [
            { sizeId: BROTO, price: r(prices[0]) },
            { sizeId: MEDIA, price: r(prices[1]) },
            { sizeId: GRANDE, price: r(prices[2]) },
            { sizeId: FAMILIA, price: r(prices[3]) },
          ],
        },
      },
    });

  const S = "Pizzas Salgadas";
  await pizza(S, "Mussarela", "Molho de tomate artesanal, mussarela, tomate fatiado, orégano e azeitonas.", [32, 44, 54, 66], IMG.pizza1, { tags: "vegetariano" });
  await pizza(S, "Calabresa", "Calabresa fatiada, cebola roxa, mussarela, azeitonas e orégano.", [34, 46, 56, 69], IMG.pizza2, { featured: true });
  await pizza(S, "Margherita", "Mussarela de búfala, tomate, manjericão fresco e azeite extravirgem.", [36, 49, 59, 72], IMG.margherita, { tags: "vegetariano" });
  await pizza(S, "Portuguesa", "Presunto, ovos, cebola, ervilha, palmito, mussarela e azeitonas.", [37, 50, 61, 75], IMG.pizza3, { featured: true });
  await pizza(S, "Frango com Catupiry", "Frango desfiado temperado com o legítimo Catupiry e milho.", [37, 50, 61, 75], IMG.pizza4, { featured: true });
  await pizza(S, "Quatro Queijos", "Mussarela, provolone, parmesão e gorgonzola.", [38, 52, 63, 78], IMG.pizza5, { tags: "vegetariano" });
  await pizza(S, "Pepperoni", "Pepperoni fatiado, mussarela e um toque de pimenta calabresa.", [39, 53, 65, 80], IMG.pepperoni, { tags: "picante" });
  await pizza(S, "Rancho", "Nossa especial: carne seca desfiada, cebola caramelizada, requeijão cremoso e mussarela.", [42, 57, 69, 85], IMG.pizza2, { featured: true });
  await pizza(S, "Bacon com Milho", "Bacon crocante, milho verde, mussarela e cebolinha.", [37, 50, 61, 75], IMG.pizza3);
  await pizza(S, "Picanha na Brasa", "Tiras de picanha na brasa, vinagrete, mussarela e farofa crocante por cima.", [45, 62, 75, 92], IMG.pizza4);
  await pizza(S, "Palmito", "Palmito pupunha, mussarela, tomate e orégano.", [37, 50, 61, 75], IMG.pizza1, { tags: "vegetariano" });
  await pizza(S, "Lombo Canadense", "Lombo canadense, Catupiry, cebola e mussarela.", [38, 52, 63, 78], IMG.pizza5);

  const D = "Pizzas Doces";
  await pizza(D, "Chocolate com Morango", "Chocolate ao leite derretido com morangos frescos.", [34, 46, 56, 69], IMG.dessert, { tags: "doce", featured: true });
  await pizza(D, "Romeu e Julieta", "Goiabada cascão derretida com mussarela.", [32, 44, 54, 66], IMG.pizza1, { tags: "doce" });
  await pizza(D, "Banana com Canela", "Banana, açúcar, canela e leite condensado.", [32, 44, 54, 66], IMG.cake, { tags: "doce" });
  await pizza(D, "Prestígio", "Chocolate, coco ralado e leite condensado.", [34, 46, 56, 69], IMG.dessert, { tags: "doce" });

  // ---------------------------------------------------------------- Lanches e adicionais
  const burgerAddons = await db.addonGroup.create({
    data: {
      name: "Turbine seu lanche",
      minSelect: 0,
      maxSelect: 8,
      addons: {
        create: [
          { name: "Bacon", price: r(5) },
          { name: "Ovo", price: r(3) },
          { name: "Cheddar cremoso", price: r(4) },
          { name: "Hambúrguer extra (150g)", price: r(9) },
          { name: "Catupiry", price: r(4) },
          { name: "Calabresa", price: r(4) },
          { name: "Cebola caramelizada", price: r(3) },
          { name: "Picles", price: r(2) },
        ],
      },
    },
  });
  const hotdogAddons = await db.addonGroup.create({
    data: {
      name: "Adicionais do dog",
      minSelect: 0,
      maxSelect: 6,
      addons: {
        create: [
          { name: "Salsicha extra", price: r(3) },
          { name: "Bacon", price: r(5) },
          { name: "Cheddar", price: r(4) },
          { name: "Batata palha extra", price: r(2) },
          { name: "Catupiry", price: r(4) },
        ],
      },
    },
  });
  const portionSauces = await db.addonGroup.create({
    data: {
      name: "Molhos extras",
      minSelect: 0,
      maxSelect: 3,
      addons: {
        create: [
          { name: "Cheddar com bacon", price: r(6) },
          { name: "Maionese da casa", price: r(3) },
          { name: "Barbecue", price: r(3) },
        ],
      },
    },
  });

  const simple = async (
    category: string,
    name: string,
    description: string,
    price: number,
    image: string,
    extra: { featured?: boolean; tags?: string; addonGroupId?: number } = {},
  ) =>
    db.product.create({
      data: {
        name,
        slug: slugify(name),
        description,
        imageUrl: image,
        kind: "SIMPLE",
        basePrice: r(price),
        categoryId: cats[category],
        featured: extra.featured ?? false,
        tags: extra.tags ?? "",
        addonGroups: extra.addonGroupId ? { connect: { id: extra.addonGroupId } } : undefined,
      },
    });

  const variant = async (
    category: string,
    name: string,
    description: string,
    variants: [string, number][],
    image: string,
    extra: { featured?: boolean; tags?: string; addonGroupId?: number } = {},
  ) =>
    db.product.create({
      data: {
        name,
        slug: slugify(name),
        description,
        imageUrl: image,
        kind: "VARIANT",
        categoryId: cats[category],
        featured: extra.featured ?? false,
        tags: extra.tags ?? "",
        variants: { create: variants.map(([vName, price], i) => ({ name: vName, price: r(price), sortOrder: i })) },
        addonGroups: extra.addonGroupId ? { connect: { id: extra.addonGroupId } } : undefined,
      },
    });

  const H = "Hambúrgueres";
  const b = burgerAddons.id;
  await simple(H, "X-Salada", "Pão brioche, hambúrguer 150g, queijo, alface, tomate e maionese da casa.", 24, IMG.burger2, { addonGroupId: b });
  await simple(H, "X-Bacon", "Hambúrguer 150g, muito bacon crocante, queijo e maionese da casa.", 28, IMG.burger1, { addonGroupId: b });
  await simple(H, "X-Tudo", "Hambúrguer 150g, bacon, ovo, presunto, queijo, calabresa, alface, tomate, milho e batata palha.", 35, IMG.burger3, { addonGroupId: b, featured: true });
  await simple(H, "X-Egg", "Hambúrguer 150g, ovo, queijo, alface e tomate.", 26, IMG.burger4, { addonGroupId: b });
  await simple(H, "Burger do Rancho", "Blend de costela 180g, queijo coalho grelhado, cebola caramelizada e barbecue da casa.", 38, IMG.burger1, { addonGroupId: b, featured: true });
  await simple(H, "Smash Duplo", "Dois smash burgers de 90g, cheddar duplo, picles e molho especial.", 32, IMG.burger4, { addonGroupId: b });
  await simple(H, "Veggie", "Hambúrguer de grão-de-bico, queijo, rúcula, tomate e maionese verde.", 29, IMG.burger2, { addonGroupId: b, tags: "vegetariano" });

  const CQ = "Cachorro-Quente";
  await simple(CQ, "Dog Tradicional", "Pão, 2 salsichas, molho de tomate, milho, ervilha, batata palha e queijo ralado.", 18, IMG.hotdog, { addonGroupId: hotdogAddons.id });
  await simple(CQ, "Dog Prensado Completo", "Prensado com purê, 2 salsichas, bacon, cheddar, milho e batata palha.", 24, IMG.hotdog, { addonGroupId: hotdogAddons.id, featured: true });

  const P = "Porções";
  await variant(P, "Batata Frita", "Batata crocante sequinha com sal e orégano.", [["Meia porção", 22], ["Inteira", 34]], IMG.fries, { addonGroupId: portionSauces.id });
  await variant(P, "Batata com Cheddar e Bacon", "Batata frita coberta com cheddar cremoso e bacon.", [["Meia porção", 30], ["Inteira", 45]], IMG.fries, { addonGroupId: portionSauces.id, featured: true });
  await variant(P, "Frango a Passarinho", "Frango temperado e frito com alho crocante.", [["Meia porção", 32], ["Inteira", 49]], IMG.meat);
  await variant(P, "Calabresa Acebolada", "Calabresa na chapa com cebola, acompanha pão.", [["Meia porção", 28], ["Inteira", 42]], IMG.grill);
  await variant(P, "Mandioca Frita", "Mandioca cozida e frita, crocante por fora e macia por dentro.", [["Meia porção", 20], ["Inteira", 30]], IMG.fries, { tags: "vegetariano" });

  // ---------------------------------------------------------------- Almoço (marmitex + buffet)
  const marmitexExtras = await db.addonGroup.create({
    data: {
      name: "Complementos da marmitex",
      minSelect: 0,
      maxSelect: 4,
      addons: {
        create: [
          { name: "Ovo frito", price: r(3) },
          { name: "Porção extra de carne", price: r(9) },
          { name: "Farofa extra", price: r(2) },
          { name: "Salada à parte", price: r(4) },
        ],
      },
    },
  });
  const A = "Almoço";
  await variant(
    A,
    "Marmitex do Dia",
    "Montada com os pratos do cardápio do dia: arroz, feijão, guarnição, salada e a mistura do dia.",
    [["Marmitex P (500g)", 19.9], ["Marmitex M (750g)", 24.9], ["Marmitex G (1kg)", 29.9]],
    IMG.plate,
    { featured: true, addonGroupId: marmitexExtras.id },
  );
  await variant(
    A,
    "Marmitex Churrasco",
    "Arroz, feijão tropeiro, vinagrete, mandioca e mix de carnes da brasa.",
    [["Marmitex P", 27.9], ["Marmitex M", 34.9], ["Marmitex G", 42.9]],
    IMG.food,
    { addonGroupId: marmitexExtras.id },
  );
  await variant(
    A,
    "Self-service por quilo (para viagem)",
    "Monte seu prato no buffet e leve pra casa. Valor por peso aproximado — ajuste no balcão.",
    [["Aprox. 500g", 34.95], ["Aprox. 750g", 52.43], ["Aprox. 1kg", 69.9]],
    IMG.lunch,
  );
  await simple(A, "Prato Executivo", "Arroz, feijão, bife acebolado, batata frita e salada.", 32, IMG.food);

  // ---------------------------------------------------------------- Churrasco
  const C = "Churrasco";
  await variant(C, "Picanha", "Picanha maturada assada na brasa, no ponto que você preferir (informe nas observações).", [["300g", 42], ["500g", 69], ["1kg", 135]], IMG.picanha, { featured: true });
  await variant(C, "Costela no Bafo", "Costela bovina assada por 10 horas, desmanchando.", [["500g", 45], ["1kg", 85]], IMG.steak);
  await variant(C, "Fraldinha", "Fraldinha suculenta com sal grosso.", [["500g", 49], ["1kg", 95]], IMG.meat);
  await variant(C, "Linguiça Toscana", "Linguiça de porco artesanal na brasa.", [["500g", 25], ["1kg", 48]], IMG.grill);
  await variant(C, "Coração de Frango", "Coração temperado com alho e ervas.", [["500g", 28], ["1kg", 52]], IMG.skewers);

  const E = "Espetinhos";
  await simple(E, "Espetinho de Carne", "Alcatra em cubos, 120g.", 12, IMG.skewers);
  await simple(E, "Espetinho de Frango com Bacon", "Coxa de frango enrolada no bacon.", 12, IMG.skewers);
  await simple(E, "Espetinho de Queijo Coalho", "Com melaço de cana ou orégano.", 10, IMG.grill, { tags: "vegetariano" });
  await simple(E, "Espetinho de Kafta", "Carne moída temperada com hortelã.", 12, IMG.skewers);
  await simple(E, "Espetinho Misto", "Carne, frango, linguiça, cebola e pimentão.", 14, IMG.skewers);

  const K = "Kits e Combos";
  await simple(K, "Kit Família (4 pessoas)", "1,2kg de carnes (picanha, linguiça, frango e costela), arroz, farofa, vinagrete, mandioca e pão de alho.", 179, IMG.steak, { featured: true });
  await simple(K, "Kit Casal", "600g de carnes variadas, arroz, farofa, vinagrete e pão de alho.", 99, IMG.picanha);
  await simple(K, "Kit Espetinhos (10 unid.)", "10 espetinhos variados + farofa e vinagrete.", 119, IMG.skewers);
  await simple(K, "Combo Pizza + Refri", "Pizza grande de até 2 sabores tradicionais + refrigerante 2L. Informe os sabores nas observações.", 69.9, IMG.pizza1, { featured: true });

  // ---------------------------------------------------------------- Bebidas
  const BB = "Bebidas";
  await variant(BB, "Coca-Cola", "Gelada.", [["Lata 350ml", 6.5], ["600ml", 9], ["2 litros", 15]], IMG.soda);
  await variant(BB, "Guaraná Antarctica", "Gelado.", [["Lata 350ml", 6], ["2 litros", 13]], IMG.soda);
  await variant(BB, "Suco Natural", "Laranja, limão, maracujá ou abacaxi com hortelã — informe o sabor.", [["Copo 400ml", 9], ["Jarra 1L", 19]], IMG.juice);
  await simple(BB, "Água Mineral", "500ml, com ou sem gás.", 4, IMG.water);
  await simple(BB, "Cerveja Long Neck", "Heineken, Budweiser ou Stella — informe a marca. Venda proibida para menores de 18 anos.", 10, IMG.beer);
  await simple(BB, "Chá Mate Gelado", "Chá mate com limão, 500ml.", 7, IMG.drinks);

  // ---------------------------------------------------------------- Sobremesas
  const SB = "Sobremesas";
  await simple(SB, "Pudim de Leite", "Fatia generosa do pudim da casa.", 12, IMG.pudding, { featured: true });
  await simple(SB, "Petit Gâteau", "Com sorvete de creme.", 19, IMG.cake);
  await variant(SB, "Açaí na Tigela", "Com banana, granola e leite condensado.", [["300ml", 16], ["500ml", 22]], IMG.icecream);
  await simple(SB, "Doce de Leite Caseiro", "Pote de 200g feito no tacho.", 14, IMG.dessert);
  await simple(SB, "Brownie", "Brownie de chocolate meio amargo.", 11, IMG.cake);

  // ---------------------------------------------------------------- Cardápio do dia (hoje)
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  await db.dailyMenu.create({
    data: {
      date: today,
      pricePerKg: r(69.9),
      notes: "Sexta tem feijoada completa! Buffet livre no salão.",
      items: {
        create: [
          ["PRATOS", "Frango assado com ervas"],
          ["PRATOS", "Carne de panela com batatas"],
          ["PRATOS", "Peixe empanado"],
          ["PRATOS", "Lasanha à bolonhesa"],
          ["GUARNICOES", "Arroz branco"],
          ["GUARNICOES", "Arroz integral"],
          ["GUARNICOES", "Feijão carioca"],
          ["GUARNICOES", "Feijão tropeiro"],
          ["GUARNICOES", "Purê de batata"],
          ["GUARNICOES", "Farofa da casa"],
          ["GUARNICOES", "Mandioca cozida"],
          ["SALADAS", "Alface, tomate e cebola"],
          ["SALADAS", "Salada de maionese"],
          ["SALADAS", "Beterraba e cenoura raladas"],
          ["SALADAS", "Vinagrete"],
          ["SOBREMESAS", "Doce de abóbora"],
          ["SOBREMESAS", "Gelatina colorida"],
        ].map(([section, name], i) => ({ section, name, sortOrder: i })),
      },
    },
  });

  // ---------------------------------------------------------------- Entregas, cupons, promoções
  await db.neighborhood.createMany({
    data: [
      { name: "Centro", fee: r(5) },
      { name: "Jardim América", fee: r(6) },
      { name: "Vila Nova", fee: r(7) },
      { name: "Santa Rita", fee: r(8) },
      { name: "Parque das Flores", fee: r(9) },
      { name: "Jardim Primavera", fee: r(10) },
      { name: "Zona Rural (até 5 km)", fee: r(15) },
    ],
  });

  const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  await db.coupon.createMany({
    data: [
      { code: "BEMVINDO10", type: "PERCENT", value: 10, minOrder: r(40), expiresAt: in60days },
      { code: "RANCHO15", type: "FIXED", value: r(15), minOrder: r(100), maxUses: 100 },
      { code: "FRETEFREE", type: "FIXED", value: r(8), minOrder: r(60) },
    ],
  });

  await db.promotion.createMany({
    data: [
      { title: "Terça da Pizza", description: "Toda terça, pizza grande de qualquer sabor salgado com borda grátis.", imageUrl: IMG.pizza2, badge: "Terça", link: "/cardapio?categoria=pizzas-salgadas", sortOrder: 0 },
      { title: "Kit Família no capricho", description: "1,2kg de churrasco com todos os acompanhamentos para 4 pessoas por R$ 179.", imageUrl: IMG.steak, badge: "Fim de semana", link: "/cardapio?categoria=kits-e-combos", sortOrder: 1 },
      { title: "10% OFF no primeiro pedido", description: "Use o cupom BEMVINDO10 em pedidos a partir de R$ 40.", imageUrl: IMG.burger1, badge: "-10%", link: "/cardapio", sortOrder: 2 },
    ],
  });

  await db.testimonial.createMany({
    data: [
      { name: "Mariana S.", text: "A pizza Rancho é a melhor da cidade! Massa leve e chega quentinha. Viramos clientes toda sexta.", rating: 5 },
      { name: "Carlos Eduardo", text: "O almoço tem gosto de comida de casa. A carne de panela de quarta é imperdível.", rating: 5 },
      { name: "Juliana P.", text: "Pedi o Kit Família pro aniversário do meu pai e todo mundo elogiou. Carne no ponto certo!", rating: 5 },
      { name: "Rafael M.", text: "X-Tudo gigante e bem servido. Entrega rápida e o motoboy super educado.", rating: 4 },
    ],
  });

  // ---------------------------------------------------------------- Usuários
  const adminPassword = await bcrypt.hash("admin123", 10);
  await db.user.create({
    data: { name: "Administrador", email: "admin@ranchos.com", passwordHash: adminPassword, role: "ADMIN", phone: "" },
  });
  const customerPassword = await bcrypt.hash("cliente123", 10);
  const centro = await db.neighborhood.findUniqueOrThrow({ where: { name: "Centro" } });
  const customer = await db.user.create({
    data: {
      name: "Cliente Teste",
      email: "cliente@teste.com",
      phone: "(11) 98888-7777",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      addresses: { create: { label: "Casa", street: "Rua das Palmeiras", number: "120", neighborhoodId: centro.id } },
    },
  });

  // ---------------------------------------------------------------- Pedidos de exemplo (últimos 7 dias)
  const products = await db.product.findMany({
    include: { category: true, variants: true, pizzaPrices: { include: { size: true } } },
  });
  const names = ["Ana Paula", "João Pedro", "Fernanda Lima", "Lucas Oliveira", "Beatriz Souza", "Pedro Henrique", "Camila Rocha", "Gustavo Alves"];
  const neighborhoods = await db.neighborhood.findMany();
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const statuses = ["ENTREGUE", "ENTREGUE", "ENTREGUE", "ENTREGUE", "CANCELADO"];

  for (let day = 6; day >= 0; day--) {
    const count = day === 0 ? 6 : 5 + Math.floor(Math.random() * 8);
    for (let n = 0; n < count; n++) {
      const createdAt = new Date(Date.now() - day * 86400000);
      createdAt.setHours(day === 0 ? Math.max(0, createdAt.getHours() - n) : 12 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      const items = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
        const p = pick(products);
        const qty = 1 + Math.floor(Math.random() * 2);
        let unit = p.basePrice;
        const details: string[] = [];
        let name = p.name;
        if (p.kind === "PIZZA") {
          const pp = pick(p.pizzaPrices);
          unit = pp.price;
          name = `Pizza ${p.name}`;
          details.push(`Tamanho: ${pp.size.name}`);
        } else if (p.kind === "VARIANT") {
          const v = pick(p.variants);
          unit = v.price;
          details.push(v.name);
        }
        return { productId: p.id, name, sector: p.category.sector, details: JSON.stringify(details), quantity: qty, unitPrice: unit, totalPrice: unit * qty };
      });
      const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
      const delivery = Math.random() > 0.3;
      const nb = pick(neighborhoods);
      const fee = delivery ? nb.fee : 0;
      // Pedidos de hoje ficam distribuídos pelo kanban
      const status = day === 0 ? ["RECEBIDO", "EM_PREPARO", "EM_PREPARO", delivery ? "SAIU_PARA_ENTREGA" : "PRONTO_RETIRADA", "ENTREGUE", "ENTREGUE"][n] : pick(statuses);
      const isCustomer = n === 0 && day % 2 === 0;
      await db.order.create({
        data: {
          code: `RP${Math.random().toString(36).slice(2, 6).toUpperCase()}${day}${n}`,
          userId: isCustomer ? customer.id : undefined,
          customerName: isCustomer ? customer.name : pick(names),
          customerPhone: isCustomer ? customer.phone! : `(11) 9${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
          type: delivery ? "DELIVERY" : "PICKUP",
          street: delivery ? "Rua Exemplo" : null,
          number: delivery ? String(10 + Math.floor(Math.random() * 900)) : null,
          neighborhoodName: delivery ? nb.name : null,
          subtotal,
          deliveryFee: fee,
          total: subtotal + fee,
          paymentMethod: pick(["PIX", "CARD", "CASH"]),
          paid: status === "ENTREGUE",
          status,
          createdAt,
          items: { create: items },
          history: { create: [{ status: "RECEBIDO", createdAt }, ...(status !== "RECEBIDO" ? [{ status, createdAt }] : [])] },
        },
      });
    }
  }

  console.log("✅ Seed concluído.");
  console.log("   Admin:   admin@ranchos.com / admin123");
  console.log("   Cliente: cliente@teste.com / cliente123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
