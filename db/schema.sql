-- ================================================================
--  TRADE JOURNAL v3 — Supabase Schema
--  วิธีใช้: Supabase Dashboard → SQL Editor → New Query → วางทั้งหมดนี้ → Run
--  รันครั้งเดียวตอน setup เท่านั้น
-- ================================================================

-- เปิด extension สำหรับ UUID
create extension if not exists "pgcrypto";

-- ================================================================
-- 1. ตาราง TRADES — หัวใจหลักของระบบ (รวมทุก pair ไว้ตารางเดียว)
-- ================================================================
create table trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  pair text not null,
  trade_date date not null,
  time_entry time,
  time_out time,

  -- session คำนวณอัตโนมัติจาก time_entry ด้วย trigger ด้านล่าง
  session text,

  direction text check (direction in ('Buy','Sell')),
  setup_type text,

  entry_price numeric,
  target_price numeric,
  stop_loss numeric,
  tick_size numeric default 0.0001,

  result text check (result in ('Win','Loss','Miss')),

  -- คำนวณอัตโนมัติด้วย trigger
  tp_r numeric,
  sl_r numeric,
  rr numeric,
  con_loss integer default 0,

  image_link text,
  video_link text,
  notes text,

  -- behavior tags เช่น Revenge Trade, FOMO, Planned
  tags text[] default '{}'
);

-- Index เพื่อให้ query เร็วแม้ข้อมูลเยอะมาก
create index idx_trades_pair on trades(pair);
create index idx_trades_date on trades(trade_date desc);
create index idx_trades_result on trades(result);
create index idx_trades_session on trades(session);

-- ================================================================
-- 2. ตาราง CONFIG — เก็บ PIN (hashed), pairs, setup types
-- ================================================================
create table app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- ค่าเริ่มต้น — PIN เริ่มต้นคือ 123456 (เก็บแบบ hash ด้วย crypt)
insert into app_config (key, value) values
  ('pin_hash', crypt('123456', gen_salt('bf'))),
  ('pairs', 'XAUUSD,EURUSD,GBPUSD,USDJPY,BTCUSD'),
  ('setup_types', 'BOS,OB,FVG,Liquidity Sweep,MSS,CISD,Other'),
  ('behavior_tags', 'Planned,Revenge Trade,FOMO,Overconfident,Hesitant,Disciplined');

-- ================================================================
-- 3. FUNCTION: คำนวณ session จากเวลา entry
-- ================================================================
create or replace function calc_session(t time)
returns text as $$
begin
  if t is null then return null; end if;
  if extract(hour from t) >= 1 and extract(hour from t) < 8 then return 'Asia';
  elsif extract(hour from t) >= 8 and extract(hour from t) < 16 then return 'London';
  else return 'New York';
  end if;
end;
$$ language plpgsql immutable;

-- ================================================================
-- 4. FUNCTION + TRIGGER: คำนวณ direction(auto), TP(R), SL(R), R:R อัตโนมัติ
--    ทำงานทุกครั้งที่ insert หรือ update แถว
-- ================================================================
create or replace function calc_trade_fields()
returns trigger as $$
declare
  auto_dir text;
begin
  new.updated_at = now();
  new.session = calc_session(new.time_entry);

  if new.entry_price is not null and new.stop_loss is not null then
    auto_dir := case when new.entry_price > new.stop_loss then 'Buy' else 'Sell' end;
    if new.direction is null then
      new.direction := auto_dir;
    end if;

    if new.tick_size is null or new.tick_size = 0 then
      new.tick_size := 0.0001;
    end if;

    if new.target_price is not null then
      new.tp_r := round(
        (case when auto_dir = 'Buy' then new.target_price - new.entry_price
              else new.entry_price - new.target_price end) / new.tick_size, 2);
    end if;

    new.sl_r := round(
      (case when auto_dir = 'Buy' then new.entry_price - new.stop_loss
            else new.stop_loss - new.entry_price end) / new.tick_size, 2);

    if new.tp_r is not null and new.sl_r is not null and new.sl_r <> 0 then
      new.rr := round(new.tp_r / new.sl_r, 2);
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_calc_trade_fields
before insert or update on trades
for each row execute function calc_trade_fields();

-- ================================================================
-- 5. FUNCTION + TRIGGER: คำนวณ consecutive loss อัตโนมัติหลัง insert/update/delete
--    คำนวณใหม่ทั้งหมดต่อ pair เรียงตามวันที่ + เวลา
-- ================================================================
create or replace function recalc_con_loss(p_pair text)
returns void as $$
declare
  r record;
  running_loss integer := 0;
begin
  for r in
    select id, result from trades
    where pair = p_pair
    order by trade_date asc, time_entry asc nulls last, created_at asc
  loop
    if r.result = 'Loss' then
      running_loss := running_loss + 1;
    elsif r.result = 'Win' then
      running_loss := 0;
    end if;
    -- Miss ไม่กระทบ streak

    update trades set con_loss = running_loss where id = r.id;
  end loop;
end;
$$ language plpgsql;

create or replace function trg_recalc_con_loss()
returns trigger as $$
begin
  if (TG_OP = 'DELETE') then
    perform recalc_con_loss(old.pair);
    return old;
  else
    perform recalc_con_loss(new.pair);
    return new;
  end if;
end;
$$ language plpgsql;

create trigger trg_after_trade_change
after insert or update of result or delete on trades
for each row execute function trg_recalc_con_loss();

-- ================================================================
-- 6. ROW LEVEL SECURITY — เปิดให้ "อ่าน" ได้ทุกคน (public view)
--    แต่ "เขียน" ต้องผ่าน RPC function ที่เช็ค PIN เท่านั้น
-- ================================================================
alter table trades enable row level security;
alter table app_config enable row level security;

-- ใครก็ตามอ่าน trades ได้ (สำหรับหน้า Public/Dashboard)
create policy "Public read trades"
  on trades for select
  using (true);

-- ห้าม insert/update/delete ตรงๆ ผ่าน REST API — ต้องผ่าน RPC เท่านั้น
-- (ไม่สร้าง policy สำหรับ insert/update/delete = ปิดกั้นโดย default)

-- app_config อ่านได้เฉพาะ pairs/setup_types/behavior_tags (ไม่ใช่ pin_hash)
create policy "Public read non-sensitive config"
  on app_config for select
  using (key != 'pin_hash');

-- ================================================================
-- 7. RPC FUNCTIONS — ทุกการเขียนข้อมูลต้องผ่านฟังก์ชันเหล่านี้ (เช็ค PIN ก่อนเสมอ)
--    ใช้ SECURITY DEFINER เพื่อให้ function มีสิทธิ์เขียนแม้ RLS จะบล็อก client
-- ================================================================

-- เช็ค PIN
create or replace function verify_pin(p_pin text)
returns boolean
security definer
set search_path = public
as $$
declare
  stored_hash text;
begin
  select value into stored_hash from app_config where key = 'pin_hash';
  return stored_hash = crypt(p_pin, stored_hash);
end;
$$ language plpgsql;

-- เปลี่ยน PIN
create or replace function change_pin(p_old_pin text, p_new_pin text)
returns json
security definer
set search_path = public
as $$
begin
  if not verify_pin(p_old_pin) then
    return json_build_object('success', false, 'message', 'Wrong current PIN');
  end if;
  if length(p_new_pin) != 6 or p_new_pin !~ '^[0-9]+$' then
    return json_build_object('success', false, 'message', 'PIN must be exactly 6 digits');
  end if;
  update app_config set value = crypt(p_new_pin, gen_salt('bf')), updated_at = now()
    where key = 'pin_hash';
  return json_build_object('success', true, 'message', 'PIN changed successfully');
end;
$$ language plpgsql;

-- เพิ่มเทรดใหม่ (ต้องใส่ PIN)
create or replace function add_trade(p_pin text, p_data jsonb)
returns json
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not verify_pin(p_pin) then
    return json_build_object('success', false, 'message', 'Wrong PIN');
  end if;

  insert into trades (
    pair, trade_date, time_entry, time_out, direction, setup_type,
    entry_price, target_price, stop_loss, tick_size, result,
    image_link, video_link, notes, tags
  ) values (
    p_data->>'pair',
    (p_data->>'trade_date')::date,
    nullif(p_data->>'time_entry','')::time,
    nullif(p_data->>'time_out','')::time,
    nullif(p_data->>'direction',''),
    p_data->>'setup_type',
    nullif(p_data->>'entry_price','')::numeric,
    nullif(p_data->>'target_price','')::numeric,
    nullif(p_data->>'stop_loss','')::numeric,
    coalesce(nullif(p_data->>'tick_size','')::numeric, 0.0001),
    p_data->>'result',
    p_data->>'image_link',
    p_data->>'video_link',
    p_data->>'notes',
    coalesce((select array_agg(x) from jsonb_array_elements_text(p_data->'tags') x), '{}')
  )
  returning id into new_id;

  return json_build_object('success', true, 'message', 'Trade added', 'id', new_id);
end;
$$ language plpgsql;

-- แก้ไขเทรด (ต้องใส่ PIN)
create or replace function edit_trade(p_pin text, p_id uuid, p_data jsonb)
returns json
security definer
set search_path = public
as $$
begin
  if not verify_pin(p_pin) then
    return json_build_object('success', false, 'message', 'Wrong PIN');
  end if;

  update trades set
    pair = p_data->>'pair',
    trade_date = (p_data->>'trade_date')::date,
    time_entry = nullif(p_data->>'time_entry','')::time,
    time_out = nullif(p_data->>'time_out','')::time,
    direction = nullif(p_data->>'direction',''),
    setup_type = p_data->>'setup_type',
    entry_price = nullif(p_data->>'entry_price','')::numeric,
    target_price = nullif(p_data->>'target_price','')::numeric,
    stop_loss = nullif(p_data->>'stop_loss','')::numeric,
    tick_size = coalesce(nullif(p_data->>'tick_size','')::numeric, 0.0001),
    result = p_data->>'result',
    image_link = p_data->>'image_link',
    video_link = p_data->>'video_link',
    notes = p_data->>'notes',
    tags = coalesce((select array_agg(x) from jsonb_array_elements_text(p_data->'tags') x), '{}')
  where id = p_id;

  return json_build_object('success', true, 'message', 'Trade updated');
end;
$$ language plpgsql;

-- ลบเทรด (ต้องใส่ PIN)
create or replace function delete_trade(p_pin text, p_id uuid)
returns json
security definer
set search_path = public
as $$
begin
  if not verify_pin(p_pin) then
    return json_build_object('success', false, 'message', 'Wrong PIN');
  end if;

  delete from trades where id = p_id;
  return json_build_object('success', true, 'message', 'Trade deleted');
end;
$$ language plpgsql;

-- แก้ผลเทรดแบบเร็ว (inline quick-edit จากตาราง — ยังต้องใส่ PIN)
create or replace function quick_update_result(p_pin text, p_id uuid, p_result text)
returns json
security definer
set search_path = public
as $$
begin
  if not verify_pin(p_pin) then
    return json_build_object('success', false, 'message', 'Wrong PIN');
  end if;

  update trades set result = p_result where id = p_id;
  return json_build_object('success', true, 'message', 'Result updated');
end;
$$ language plpgsql;

-- บันทึก pairs (ต้องใส่ PIN)
create or replace function save_pairs(p_pin text, p_pairs text)
returns json
security definer
set search_path = public
as $$
begin
  if not verify_pin(p_pin) then
    return json_build_object('success', false, 'message', 'Wrong PIN');
  end if;
  update app_config set value = p_pairs, updated_at = now() where key = 'pairs';
  return json_build_object('success', true, 'message', 'Pairs saved');
end;
$$ language plpgsql;

-- บันทึก setup types (ต้องใส่ PIN)
create or replace function save_setup_types(p_pin text, p_setups text)
returns json
security definer
set search_path = public
as $$
begin
  if not verify_pin(p_pin) then
    return json_build_object('success', false, 'message', 'Wrong PIN');
  end if;
  update app_config set value = p_setups, updated_at = now() where key = 'setup_types';
  return json_build_object('success', true, 'message', 'Setup types saved');
end;
$$ language plpgsql;

-- บันทึก behavior tags (ต้องใส่ PIN)
create or replace function save_behavior_tags(p_pin text, p_tags text)
returns json
security definer
set search_path = public
as $$
begin
  if not verify_pin(p_pin) then
    return json_build_object('success', false, 'message', 'Wrong PIN');
  end if;
  update app_config set value = p_tags, updated_at = now() where key = 'behavior_tags';
  return json_build_object('success', true, 'message', 'Tags saved');
end;
$$ language plpgsql;

-- ================================================================
-- 8. VIEW สำหรับ Dashboard stats — คำนวณฝั่ง DB ให้เร็วและเบาบน client
-- ================================================================
create or replace view v_dashboard_overall as
select
  count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  count(*) filter (where result = 'Miss') as miss,
  round(
    100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1
  ) as win_rate,
  round(
    coalesce(sum(case when result = 'Win' then rr when result = 'Loss' then -1 else 0 end), 0), 2
  ) as total_rr,
  coalesce(max(con_loss), 0) as max_con_loss
from trades;

create or replace view v_dashboard_by_pair as
select
  pair,
  count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  round(
    100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1
  ) as win_rate
from trades
group by pair;

create or replace view v_dashboard_by_session as
select
  session,
  count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss
from trades
where session is not null
group by session;

create or replace view v_dashboard_by_setup as
select
  setup_type,
  count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss
from trades
where setup_type is not null
group by setup_type;

create or replace view v_calendar_daily as
select
  trade_date,
  count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  count(*) filter (where result = 'Miss') as miss,
  round(coalesce(sum(case when result = 'Win' then rr when result = 'Loss' then -1 else 0 end), 0), 2) as net_rr
from trades
group by trade_date;

-- ================================================================
-- DONE — ตรวจสอบด้วย query นี้:
-- select * from app_config;
-- select * from trades limit 5;
-- ================================================================