-- =============================================================================
-- SCENTLOG — Development seed data
-- -----------------------------------------------------------------------------
-- Small, hand-written catalogue for local development and previews.
-- Facts (brand, year, perfumer, notes) are public information; descriptions
-- are original text. No third-party images are included: the UI renders a
-- typographic placeholder until an image is uploaded to Supabase Storage.
-- No fake users or reviews are created.
-- =============================================================================

insert into public.fragrance_families (slug, name_en, name_es) values
  ('amber',          'Amber',          'Ámbar'),
  ('amber-floral',   'Amber Floral',   'Ámbar floral'),
  ('amber-woody',    'Amber Woody',    'Ámbar amaderado'),
  ('aromatic',       'Aromatic',       'Aromática'),
  ('aromatic-fougere','Aromatic Fougère','Fougère aromática'),
  ('chypre',         'Chypre',         'Chipre'),
  ('chypre-fruity',  'Chypre Fruity',  'Chipre afrutada'),
  ('citrus',         'Citrus',         'Cítrica'),
  ('floral',         'Floral',         'Floral'),
  ('floral-aldehyde','Floral Aldehyde','Floral aldehídica'),
  ('gourmand',       'Gourmand',       'Gourmand'),
  ('green',          'Green',          'Verde'),
  ('leather',        'Leather',        'Cuero'),
  ('woody',          'Woody',          'Amaderada'),
  ('woody-aromatic', 'Woody Aromatic', 'Amaderada aromática'),
  ('woody-spicy',    'Woody Spicy',    'Amaderada especiada')
on conflict (slug) do nothing;

insert into public.notes (slug, name_en, name_es) values
  ('aldehydes', 'Aldehydes', 'Aldehídos'),
  ('ambergris', 'Ambergris', 'Ámbar gris'),
  ('ambroxan', 'Ambroxan', 'Ambroxan'),
  ('amberwood', 'Amberwood', 'Madera ambarada'),
  ('apple', 'Apple', 'Manzana'),
  ('benzoin', 'Benzoin', 'Benjuí'),
  ('bergamot', 'Bergamot', 'Bergamota'),
  ('birch', 'Birch', 'Abedul'),
  ('blackcurrant', 'Blackcurrant', 'Grosella negra'),
  ('cardamom', 'Cardamom', 'Cardamomo'),
  ('cedar', 'Cedar', 'Cedro'),
  ('fig-leaf', 'Fig leaf', 'Hoja de higuera'),
  ('fig', 'Fig', 'Higo'),
  ('fir-resin', 'Fir resin', 'Resina de abeto'),
  ('geranium', 'Geranium', 'Geranio'),
  ('ginger', 'Ginger', 'Jengibre'),
  ('grapefruit', 'Grapefruit', 'Pomelo'),
  ('incense', 'Incense', 'Incienso'),
  ('iris', 'Iris', 'Iris'),
  ('jasmine', 'Jasmine', 'Jazmín'),
  ('juniper', 'Juniper', 'Enebro'),
  ('labdanum', 'Labdanum', 'Ládano'),
  ('lavender', 'Lavender', 'Lavanda'),
  ('leather', 'Leather', 'Cuero'),
  ('lemon', 'Lemon', 'Limón'),
  ('mint', 'Mint', 'Menta'),
  ('musk', 'Musk', 'Almizcle'),
  ('neroli', 'Neroli', 'Neroli'),
  ('nutmeg', 'Nutmeg', 'Nuez moscada'),
  ('oakmoss', 'Oakmoss', 'Musgo de roble'),
  ('opoponax', 'Opoponax', 'Opopónaco'),
  ('orange', 'Orange', 'Naranja'),
  ('papyrus', 'Papyrus', 'Papiro'),
  ('patchouli', 'Patchouli', 'Pachulí'),
  ('pepper', 'Pepper', 'Pimienta'),
  ('pineapple', 'Pineapple', 'Piña'),
  ('pine-needles', 'Pine needles', 'Agujas de pino'),
  ('pink-pepper', 'Pink pepper', 'Pimienta rosa'),
  ('rose', 'Rose', 'Rosa'),
  ('saffron', 'Saffron', 'Azafrán'),
  ('sandalwood', 'Sandalwood', 'Sándalo'),
  ('sichuan-pepper', 'Sichuan pepper', 'Pimienta de Sichuan'),
  ('tonka-bean', 'Tonka bean', 'Haba tonka'),
  ('vanilla', 'Vanilla', 'Vainilla'),
  ('vetiver', 'Vetiver', 'Vetiver'),
  ('violet', 'Violet', 'Violeta'),
  ('ylang-ylang', 'Ylang-ylang', 'Ylang-ylang')
on conflict (slug) do nothing;

insert into public.brands (slug, name, country, founded_year) values
  ('chanel', 'Chanel', 'France', 1910),
  ('dior', 'Dior', 'France', 1946),
  ('guerlain', 'Guerlain', 'France', 1828),
  ('hermes', 'Hermès', 'France', 1837),
  ('maison-francis-kurkdjian', 'Maison Francis Kurkdjian', 'France', 2009),
  ('le-labo', 'Le Labo', 'United States', 2006),
  ('byredo', 'Byredo', 'Sweden', 2006),
  ('diptyque', 'Diptyque', 'France', 1961),
  ('creed', 'Creed', 'France', 1760)
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('jacques-polge', 'Jacques Polge'),
  ('francois-demachy', 'François Demachy'),
  ('jacques-guerlain', 'Jacques Guerlain'),
  ('jean-claude-ellena', 'Jean-Claude Ellena'),
  ('francis-kurkdjian', 'Francis Kurkdjian'),
  ('frank-voelkl', 'Frank Voelkl'),
  ('jerome-epinette', 'Jérôme Epinette'),
  ('olivia-giacobetti', 'Olivia Giacobetti'),
  ('olivier-creed', 'Olivier Creed'),
  ('erwin-creed', 'Erwin Creed')
on conflict (slug) do nothing;

-- Fragrances -------------------------------------------------------------------
with f (slug, brand, name, concentration, year, family, en, es) as (values
  ('chanel-bleu-de-chanel-edt', 'chanel', 'Bleu de Chanel', 'edt', 2010, 'woody-aromatic',
   'A crisp, citrus-led woody aromatic: grapefruit and mint over a dry cedar and incense base.',
   'Un amaderado aromático nítido y cítrico: pomelo y menta sobre una base seca de cedro e incienso.'),
  ('chanel-bleu-de-chanel-edp', 'chanel', 'Bleu de Chanel', 'edp', 2014, 'woody-aromatic',
   'The Eau de Parfum rounds the original with a warmer, creamier sandalwood heart.',
   'La Eau de Parfum redondea el original con un corazón de sándalo más cálido y cremoso.'),
  ('chanel-no-5-edp', 'chanel', 'N°5', 'edp', 1986, 'floral-aldehyde',
   'The aldehydic floral, reinterpreted as an Eau de Parfum: sparkling, powdery, endlessly polished.',
   'El floral aldehídico reinterpretado como Eau de Parfum: chispeante, empolvado, impecable.'),
  ('dior-sauvage-edt', 'dior', 'Sauvage', 'edt', 2015, 'aromatic-fougere',
   'Bright bergamot and peppery spice over a mineral, ambroxan-heavy trail.',
   'Bergamota luminosa y especias picantes sobre una estela mineral cargada de ambroxan.'),
  ('guerlain-shalimar-edp', 'guerlain', 'Shalimar', 'edp', 1925, 'amber',
   'A foundational amber: citrus brightness melting into smoky vanilla, iris and resins.',
   'Un ámbar fundacional: el brillo cítrico se funde en vainilla ahumada, iris y resinas.'),
  ('hermes-terre-d-hermes-edt', 'hermes', 'Terre d''Hermès', 'edt', 2006, 'woody-spicy',
   'Orange and flint over vetiver and cedar — earth and sky in a single, mineral line.',
   'Naranja y pedernal sobre vetiver y cedro: tierra y cielo en una sola línea mineral.'),
  ('mfk-baccarat-rouge-540-edp', 'maison-francis-kurkdjian', 'Baccarat Rouge 540', 'edp', 2015, 'amber-floral',
   'Airy saffron and jasmine over a radiant, almost crystalline amberwood accord.',
   'Azafrán y jazmín etéreos sobre un acorde de madera ambarada radiante, casi cristalino.'),
  ('le-labo-santal-33-edp', 'le-labo', 'Santal 33', 'edp', 2011, 'woody',
   'Sandalwood, cardamom and violet with a dry, leathery papyrus edge.',
   'Sándalo, cardamomo y violeta con un borde seco de papiro y cuero.'),
  ('byredo-gypsy-water-edp', 'byredo', 'Gypsy Water', 'edp', 2008, 'woody-aromatic',
   'Juniper, pine needles and incense softened by amber and vanilla — a fresh woodland haze.',
   'Enebro, agujas de pino e incienso suavizados por ámbar y vainilla: una bruma fresca de bosque.'),
  ('diptyque-philosykos-edt', 'diptyque', 'Philosykos', 'edt', 1996, 'green',
   'The whole fig tree: green leaf, milky fruit and pale, sun-warmed wood.',
   'La higuera entera: hoja verde, fruto lechoso y madera pálida calentada por el sol.'),
  ('creed-aventus-edp', 'creed', 'Aventus', 'edp', 2010, 'chypre-fruity',
   'Pineapple and blackcurrant over smoky birch, musk and oakmoss.',
   'Piña y grosella negra sobre abedul ahumado, almizcle y musgo de roble.')
)
insert into public.fragrances
  (slug, brand_id, name, concentration, release_year, family_id, description_en, description_es)
select f.slug, b.id, f.name, f.concentration::public.fragrance_concentration, f.year, fam.id, f.en, f.es
from f
join public.brands b on b.slug = f.brand
left join public.fragrance_families fam on fam.slug = f.family
on conflict (slug) do nothing;

-- The EDP is a separate entry linked to the original EDT.
update public.fragrances
set parent_id = (select id from public.fragrances where slug = 'chanel-bleu-de-chanel-edt')
where slug = 'chanel-bleu-de-chanel-edp';

-- Perfumers ----------------------------------------------------------------------
insert into public.fragrance_perfumers (fragrance_id, perfumer_id)
select fr.id, p.id
from (values
  ('chanel-bleu-de-chanel-edt', 'jacques-polge'),
  ('chanel-bleu-de-chanel-edp', 'jacques-polge'),
  ('chanel-no-5-edp', 'jacques-polge'),
  ('dior-sauvage-edt', 'francois-demachy'),
  ('guerlain-shalimar-edp', 'jacques-guerlain'),
  ('hermes-terre-d-hermes-edt', 'jean-claude-ellena'),
  ('mfk-baccarat-rouge-540-edp', 'francis-kurkdjian'),
  ('le-labo-santal-33-edp', 'frank-voelkl'),
  ('byredo-gypsy-water-edp', 'jerome-epinette'),
  ('diptyque-philosykos-edt', 'olivia-giacobetti'),
  ('creed-aventus-edp', 'olivier-creed'),
  ('creed-aventus-edp', 'erwin-creed')
) as x (fragrance, perfumer)
join public.fragrances fr on fr.slug = x.fragrance
join public.perfumers p on p.slug = x.perfumer
on conflict do nothing;

-- Notes pyramid --------------------------------------------------------------------
insert into public.fragrance_notes (fragrance_id, note_id, layer, position)
select fr.id, n.id, x.layer::public.note_layer, x.pos
from (values
  ('chanel-bleu-de-chanel-edt', 'grapefruit', 'top', 1),
  ('chanel-bleu-de-chanel-edt', 'lemon', 'top', 2),
  ('chanel-bleu-de-chanel-edt', 'mint', 'top', 3),
  ('chanel-bleu-de-chanel-edt', 'pink-pepper', 'top', 4),
  ('chanel-bleu-de-chanel-edt', 'ginger', 'heart', 1),
  ('chanel-bleu-de-chanel-edt', 'nutmeg', 'heart', 2),
  ('chanel-bleu-de-chanel-edt', 'jasmine', 'heart', 3),
  ('chanel-bleu-de-chanel-edt', 'incense', 'base', 1),
  ('chanel-bleu-de-chanel-edt', 'cedar', 'base', 2),
  ('chanel-bleu-de-chanel-edt', 'vetiver', 'base', 3),
  ('chanel-bleu-de-chanel-edt', 'sandalwood', 'base', 4),

  ('chanel-bleu-de-chanel-edp', 'grapefruit', 'top', 1),
  ('chanel-bleu-de-chanel-edp', 'lemon', 'top', 2),
  ('chanel-bleu-de-chanel-edp', 'mint', 'top', 3),
  ('chanel-bleu-de-chanel-edp', 'ginger', 'heart', 1),
  ('chanel-bleu-de-chanel-edp', 'nutmeg', 'heart', 2),
  ('chanel-bleu-de-chanel-edp', 'jasmine', 'heart', 3),
  ('chanel-bleu-de-chanel-edp', 'sandalwood', 'base', 1),
  ('chanel-bleu-de-chanel-edp', 'cedar', 'base', 2),
  ('chanel-bleu-de-chanel-edp', 'incense', 'base', 3),

  ('chanel-no-5-edp', 'aldehydes', 'top', 1),
  ('chanel-no-5-edp', 'bergamot', 'top', 2),
  ('chanel-no-5-edp', 'neroli', 'top', 3),
  ('chanel-no-5-edp', 'jasmine', 'heart', 1),
  ('chanel-no-5-edp', 'rose', 'heart', 2),
  ('chanel-no-5-edp', 'ylang-ylang', 'heart', 3),
  ('chanel-no-5-edp', 'iris', 'heart', 4),
  ('chanel-no-5-edp', 'sandalwood', 'base', 1),
  ('chanel-no-5-edp', 'vanilla', 'base', 2),
  ('chanel-no-5-edp', 'vetiver', 'base', 3),

  ('dior-sauvage-edt', 'bergamot', 'top', 1),
  ('dior-sauvage-edt', 'pepper', 'top', 2),
  ('dior-sauvage-edt', 'sichuan-pepper', 'heart', 1),
  ('dior-sauvage-edt', 'lavender', 'heart', 2),
  ('dior-sauvage-edt', 'geranium', 'heart', 3),
  ('dior-sauvage-edt', 'ambroxan', 'base', 1),
  ('dior-sauvage-edt', 'cedar', 'base', 2),
  ('dior-sauvage-edt', 'labdanum', 'base', 3),

  ('guerlain-shalimar-edp', 'bergamot', 'top', 1),
  ('guerlain-shalimar-edp', 'lemon', 'top', 2),
  ('guerlain-shalimar-edp', 'iris', 'heart', 1),
  ('guerlain-shalimar-edp', 'jasmine', 'heart', 2),
  ('guerlain-shalimar-edp', 'rose', 'heart', 3),
  ('guerlain-shalimar-edp', 'vanilla', 'base', 1),
  ('guerlain-shalimar-edp', 'tonka-bean', 'base', 2),
  ('guerlain-shalimar-edp', 'opoponax', 'base', 3),
  ('guerlain-shalimar-edp', 'incense', 'base', 4),

  ('hermes-terre-d-hermes-edt', 'orange', 'top', 1),
  ('hermes-terre-d-hermes-edt', 'grapefruit', 'top', 2),
  ('hermes-terre-d-hermes-edt', 'pepper', 'heart', 1),
  ('hermes-terre-d-hermes-edt', 'geranium', 'heart', 2),
  ('hermes-terre-d-hermes-edt', 'vetiver', 'base', 1),
  ('hermes-terre-d-hermes-edt', 'cedar', 'base', 2),
  ('hermes-terre-d-hermes-edt', 'benzoin', 'base', 3),

  ('mfk-baccarat-rouge-540-edp', 'saffron', 'top', 1),
  ('mfk-baccarat-rouge-540-edp', 'jasmine', 'heart', 1),
  ('mfk-baccarat-rouge-540-edp', 'amberwood', 'heart', 2),
  ('mfk-baccarat-rouge-540-edp', 'ambergris', 'base', 1),
  ('mfk-baccarat-rouge-540-edp', 'fir-resin', 'base', 2),
  ('mfk-baccarat-rouge-540-edp', 'cedar', 'base', 3),

  ('le-labo-santal-33-edp', 'cardamom', 'top', 1),
  ('le-labo-santal-33-edp', 'violet', 'top', 2),
  ('le-labo-santal-33-edp', 'iris', 'heart', 1),
  ('le-labo-santal-33-edp', 'ambroxan', 'heart', 2),
  ('le-labo-santal-33-edp', 'papyrus', 'heart', 3),
  ('le-labo-santal-33-edp', 'sandalwood', 'base', 1),
  ('le-labo-santal-33-edp', 'cedar', 'base', 2),
  ('le-labo-santal-33-edp', 'leather', 'base', 3),

  ('byredo-gypsy-water-edp', 'bergamot', 'top', 1),
  ('byredo-gypsy-water-edp', 'lemon', 'top', 2),
  ('byredo-gypsy-water-edp', 'pepper', 'top', 3),
  ('byredo-gypsy-water-edp', 'juniper', 'top', 4),
  ('byredo-gypsy-water-edp', 'incense', 'heart', 1),
  ('byredo-gypsy-water-edp', 'pine-needles', 'heart', 2),
  ('byredo-gypsy-water-edp', 'iris', 'heart', 3),
  ('byredo-gypsy-water-edp', 'vanilla', 'base', 1),
  ('byredo-gypsy-water-edp', 'sandalwood', 'base', 2),

  ('diptyque-philosykos-edt', 'fig-leaf', 'top', 1),
  ('diptyque-philosykos-edt', 'fig', 'heart', 1),
  ('diptyque-philosykos-edt', 'cedar', 'base', 1),

  ('creed-aventus-edp', 'pineapple', 'top', 1),
  ('creed-aventus-edp', 'bergamot', 'top', 2),
  ('creed-aventus-edp', 'blackcurrant', 'top', 3),
  ('creed-aventus-edp', 'apple', 'top', 4),
  ('creed-aventus-edp', 'birch', 'heart', 1),
  ('creed-aventus-edp', 'patchouli', 'heart', 2),
  ('creed-aventus-edp', 'jasmine', 'heart', 3),
  ('creed-aventus-edp', 'musk', 'base', 1),
  ('creed-aventus-edp', 'oakmoss', 'base', 2),
  ('creed-aventus-edp', 'ambergris', 'base', 3),
  ('creed-aventus-edp', 'vanilla', 'base', 4)
) as x (fragrance, note, layer, pos)
join public.fragrances fr on fr.slug = x.fragrance
join public.notes n on n.slug = x.note
on conflict do nothing;
