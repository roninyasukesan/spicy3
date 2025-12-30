insert into profiles (name, city, price, image_url, age, rating, reviews, is_verified, bio, services, fetishes, gallery, characteristics)
values (
  'Laura Diamond',
  'São Paulo',
  'R$ 500/h',
  null,
  23,
  4.8,
  24,
  true,
  'Adoro conhecer pessoas novas e proporcionar momentos inesquecíveis.',
  array['Jantar','Cinema','Viagens curtas'],
  array['Roleplay','Massagem Erótica'],
  array['https://example.com/foto1.jpg','https://example.com/foto2.jpg'],
  '{"hairColor":"Loiro","ethnicity":"Branca","bodyType":"Curvilínea","height":"1,70m","eyes":"Azuis"}'::jsonb
),
(
  'Isabella Gold',
  'Rio de Janeiro',
  'R$ 650/h',
  null,
  25,
  5.0,
  42,
  true,
  'Sofisticação e beleza em cada detalhe.',
  array['Eventos','Jantar de negócios','Viagens internacionais'],
  array['Dominatrix','Submissão'],
  array['https://example.com/foto3.jpg','https://example.com/foto4.jpg'],
  '{"hairColor":"Castanho","ethnicity":"Branca","bodyType":"Atlética","height":"1,68m","eyes":"Castanhos"}'::jsonb
);
