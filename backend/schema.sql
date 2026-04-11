-- =====================
-- TAMAGOTCHIS
-- =====================
create table tamagotchis (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  body_url      text,
  hat_url       text,
  face_url      text,
  neck_url      text,
  location_x    float default 0,
  location_y    float default 0,
  best_friend_id uuid references tamagotchis(id) on delete set null,
  created_at    timestamptz default now()
);

-- =====================
-- ACTIVITIES
-- =====================
create table activities (
  id                  uuid primary key default gen_random_uuid(),
  tama_a_id           uuid references tamagotchis(id) on delete cascade,
  tama_b_id           uuid references tamagotchis(id) on delete cascade,
  description         text not null,
  activity_image_url  text,
  created_at          timestamptz default now()
);

-- =====================
-- INDEXES
-- =====================
create index on activities(tama_a_id);
create index on activities(tama_b_id);
create index on activities(created_at desc);
