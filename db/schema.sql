-- ================================================================
--  TRADELOG MASTER DATABASE SCHEMA — COMPILATION EDITION
--  รันคำสั่งชุดนี้เพียงรอบเดียวเพื่อจัดทำตารางและระบบวิเคราะห์ทั้งหมด
-- ================================================================

-- 1. ยืนยันการเปิดปลั๊กอินเข้ารหัสความปลอดภัยระดับฐานข้อมูล
create extension if not exists "pgcrypto" schema extensions;

-- 2. สร้างตารางเก็บข้อมูลพอร์ตการเทรดหลัก (TRADES)
create table trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  pair text not null,
  trade_date date not null,
  exit_date date,
  time_entry time,
  time_out time,

  session text,
  direction text check (direction in ('Buy','Sell')),
  setup_type text,

  entry_price numeric,
  target_price numeric,
  stop_loss numeric,
  tick_size numeric default 0.0001,
  lot_size numeric,
  loss_amount numeric,

  result text check (result in ('Win','Loss','Miss')),

  -- ฟิลด์คำนวณอัตโนมัติด้วย trigger ระดับ DB
  tp_r numeric,
  sl_r numeric,
  rr numeric,
  con_loss integer default 0,

  image_link text,
  video_link text,
  notes text,
  tags text[] default '{}'
);

-- ดัชนีระบบประมวลผลด่วน (Index Optimization)
create index idx_trades_pair on trades(pair);
create index idx_trades_date on trades(trade_date desc);
create index idx_trades_result on trades(result);
create index idx_trades_session on trades(session);
create index idx_trades_entry_time on trades(time_entry);

-- 3. สร้างตารางบันทึกค่าระบบงานแอปพลิเคชัน (APP_CONFIG)
create table app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- บันทึกค่าเริ่มต้นหลักของระบบงาน (แฮชรหัส PIN '123456' ด้วย Bcrypt ทันที)
insert into app_config (key, value) values
  ('pin_hash', extensions.crypt('123456', extensions.gen_salt('bf'))),
  ('pairs', 'XAUUSD,EURUSD,GBPUSD,USDJPY,BTCUSD'),
  ('setup_types', 'BOS,OB,FVG,Liquidity Sweep,MSS,Other'),
  ('behavior_tags', 'Planned,Revenge Trade,FOMO,Overconfident,Hesitant,Disciplined');

-- 4. สร้างตารางบันทึกประวัติการกระทำของระบบ (AUDIT_LOG)
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  action text not null,
  target_id uuid,
  target_pair text,
  details jsonb
);

-- 5. สร้างตารางบันทึกจำนวนการเข้าส่องหน้าเว็บ (PAGE_VIEWS)
create table page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  page text not null,
  referrer text,
  user_agent text
);

-- 6. ตารางบันทึกผู้ยิงรหัสผ่านเพื่อ Lockout (PIN_ATTEMPTS)
create table pin_attempts (
  client_ip text primary key,
  attempts int default 0,
  locked_until timestamptz
);

-- 7. ตารางออกเซสชันคีย์อายุสั้นความปลอดภัยสูงสุด (OWNER_SESSIONS)
create table owner_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- 8. เปิดใช้ ROW LEVEL SECURITY (RLS) เพื่อไม่ให้คนนอกเจาะข้อมูลชั้นสูงได้
alter table trades enable row level security;
alter table app_config enable row level security;
alter table audit_log enable row level security;
alter table page_views enable row level security;
alter table pin_attempts enable row level security;
alter table owner_sessions enable row level security;

-- สิทธิ์ในการอ่านข้อมูลสาธารณะ
create policy "Public read trades" on trades for select using (true);
create policy "Public read config" on app_config for select using (key != 'pin_hash');
create policy "Public insert views" on page_views for insert with check (true);

-- 9. TRIGGERS: คำนวณช่วงระยะห่างทางผ่านและ Session คลาดเคลื่อนโดยอัตโนมัติ
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

-- TRIGGERS: คำนวณ Streak ความสูญเสียสะสมย้อนหลัง
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

-- 10. SYSTEM FUNCTIONS (RPCs)
-- 10.1 ดึง IP แอดเดรส
create or replace function get_client_ip()
returns text as $$
begin
  return coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    '127.0.0.1'
  );
end;
$$ language plpgsql stable;

-- 10.2 ฟังก์ชันยืนยันตัวตน
create or replace function verify_pin(p_pin text)
returns json
security definer
set search_path = public, extensions
as $$
declare
  v_ip text;
  v_attempts int;
  v_locked_until timestamptz;
  v_stored_hash text;
  v_token uuid;
begin
  v_ip := get_client_ip();
  
  select attempts, locked_until into v_attempts, v_locked_until 
  from pin_attempts where client_ip = v_ip;

  if v_locked_until is not null and v_locked_until > now() then
    return json_build_object(
      'success', false, 
      'message', 'Too many verification failures. IP blocked for ' || ceil(extract(epoch from (v_locked_until - now())) / 60) || ' minutes.'
    );
  end if;

  select value into v_stored_hash from app_config where key = 'pin_hash';

  if v_stored_hash = crypt(p_pin, v_stored_hash) then
    delete from pin_attempts where client_ip = v_ip;
    
    insert into owner_sessions (expires_at) 
    values (now() + interval '15 minutes') 
    returning id into v_token;

    return json_build_object('success', true, 'token', v_token);
  else
    if v_attempts is null then
      insert into pin_attempts (client_ip, attempts) values (v_ip, 1);
      v_attempts := 1;
    else
      v_attempts := v_attempts + 1;
      if v_attempts >= 5 then
        update pin_attempts 
        set attempts = v_attempts, locked_until = now() + interval '15 minutes'
        where client_ip = v_ip;
        return json_build_object('success', false, 'message', 'Security limit reached. IP blocked for 15 minutes.');
      else
        update pin_attempts set attempts = v_attempts where client_ip = v_ip;
      end if;
    end if;

    return json_build_object('success', false, 'message', 'Verification failed. Attempts remaining: ' || (5 - v_attempts));
  end if;
end;
$$ language plpgsql;

-- 10.3 ฟังก์ชันตรวจสอบทอเคน
create or replace function is_valid_session(p_token uuid)
returns boolean as $$
begin
  return exists (
    select 1 from owner_sessions 
    where id = p_token and expires_at > now()
  );
end;
$$ language plpgsql stable security definer;

-- 10.4 ฟังก์ชันบันทึกข้อมูลเทรด
create or replace function add_trade(p_token uuid, p_data jsonb)
returns json
security definer
set search_path = public, extensions
as $$
declare new_id uuid;
begin
  if not is_valid_session(p_token) then
    return json_build_object('success', false, 'message', 'Session expired. Please re-authenticate.');
  end if;

  insert into trades (
    pair, trade_date, exit_date, time_entry, time_out, direction, setup_type,
    entry_price, target_price, stop_loss, tick_size, lot_size, loss_amount,
    result, image_link, video_link, notes, tags
  ) values (
    p_data->>'pair',
    (p_data->>'trade_date')::date,
    nullif(p_data->>'exit_date','')::date,
    nullif(p_data->>'time_entry','')::time,
    nullif(p_data->>'time_out','')::time,
    nullif(p_data->>'direction',''),
    p_data->>'setup_type',
    nullif(p_data->>'entry_price','')::numeric,
    nullif(p_data->>'target_price','')::numeric,
    nullif(p_data->>'stop_loss','')::numeric,
    coalesce(nullif(p_data->>'tick_size','')::numeric, 0.0001),
    nullif(p_data->>'lot_size','')::numeric,
    nullif(p_data->>'loss_amount','')::numeric,
    p_data->>'result',
    p_data->>'image_link',
    p_data->>'video_link',
    p_data->>'notes',
    coalesce((select array_agg(x) from jsonb_array_elements_text(p_data->'tags') x), '{}')
  ) returning id into new_id;

  insert into audit_log (action, target_id, target_pair)
  values ('add_trade', new_id, p_data->>'pair');

  return json_build_object('success', true, 'message', 'Trade added successfully');
end;
$$ language plpgsql;

-- 10.5 ฟังก์ชันแก้ไขรายการเทรด
create or replace function edit_trade(p_token uuid, p_id uuid, p_data jsonb)
returns json
security definer
set search_path = public, extensions
as $$
begin
  if not is_valid_session(p_token) then
    return json_build_object('success', false, 'message', 'Session expired. Please re-authenticate.');
  end if;

  update trades set
    pair         = p_data->>'pair',
    trade_date   = (p_data->>'trade_date')::date,
    exit_date    = nullif(p_data->>'exit_date','')::date,
    time_entry   = nullif(p_data->>'time_entry','')::time,
    time_out     = nullif(p_data->>'time_out','')::time,
    direction    = nullif(p_data->>'direction',''),
    setup_type   = nullif(p_data->>'setup_type',''),
    entry_price  = nullif(p_data->>'entry_price','')::numeric,
    target_price = nullif(p_data->>'target_price','')::numeric,
    stop_loss    = nullif(p_data->>'stop_loss','')::numeric,
    tick_size    = coalesce(nullif(p_data->>'tick_size','')::numeric, 0.0001),
    lot_size     = nullif(p_data->>'lot_size','')::numeric,
    loss_amount  = nullif(p_data->>'loss_amount','')::numeric,
    result       = nullif(p_data->>'result',''),
    image_link   = nullif(p_data->>'image_link',''),
    video_link   = nullif(p_data->>'video_link',''),
    notes        = nullif(p_data->>'notes',''),
    tags         = coalesce((select array_agg(x) from jsonb_array_elements_text(p_data->'tags') x), '{}')
  where id = p_id;

  insert into audit_log (action, target_id, target_pair)
  values ('edit_trade', p_id, p_data->>'pair');

  return json_build_object('success', true, 'message', 'Trade updated successfully');
end;
$$ language plpgsql;

-- 10.6 ฟังก์ชันลบรายการเทรด
create or replace function delete_trade(p_token uuid, p_id uuid)
returns json
security definer
set search_path = public, extensions
as $$
begin
  if not is_valid_session(p_token) then
    return json_build_object('success', false, 'message', 'Session expired. Please re-authenticate.');
  end if;

  delete from trades where id = p_id;
  return json_build_object('success', true, 'message', 'Trade deleted');
end;
$$ language plpgsql;

-- 10.7 ฟังก์ชันปรับรหัสผ่าน PIN
create or replace function change_pin(p_token uuid, p_old_pin text, p_new_pin text)
returns json
security definer
set search_path = public, extensions
as $$
declare
  v_stored_hash text;
begin
  if not is_valid_session(p_token) then
    return json_build_object('success', false, 'message', 'Session expired');
  end if;
  
  select value into v_stored_hash from app_config where key = 'pin_hash';
  if v_stored_hash != crypt(p_old_pin, v_stored_hash) then
    return json_build_object('success', false, 'message', 'Wrong current PIN');
  end if;
  if length(p_new_pin) != 6 or p_new_pin !~ '^[0-9]+$' then
    return json_build_object('success', false, 'message', 'PIN must be exactly 6 digits');
  end if;
  
  update app_config set value = crypt(p_new_pin, gen_salt('bf')), updated_at = now()
    where key = 'pin_hash';
  
  delete from owner_sessions;
  
  return json_build_object('success', true, 'message', 'PIN changed successfully');
end;
$$ language plpgsql;

-- 10.8 ฟังก์ชันแผงสถิติเบ็ดเตล็ดอื่น ๆ
create or replace function save_pairs(p_token uuid, p_pairs text)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Session expired'); end if;
  update app_config set value = p_pairs, updated_at = now() where key = 'pairs';
  return json_build_object('success', true, 'message', 'Pairs saved');
end; $$ language plpgsql;

create or replace function save_setup_types(p_token uuid, p_setups text)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Session expired'); end if;
  update app_config set value = p_setups, updated_at = now() where key = 'setup_types';
  return json_build_object('success', true, 'message', 'Setup types saved');
end; $$ language plpgsql;

create or replace function save_behavior_tags(p_token uuid, p_tags text)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Session expired'); end if;
  update app_config set value = p_tags, updated_at = now() where key = 'behavior_tags';
  return json_build_object('success', true, 'message', 'Tags saved');
end; $$ language plpgsql;

-- 11. DATABASE VIEWS
create or replace view v_dashboard_overall as
select
  count(*) as total,
  count(*) filter (where result = 'Win')  as win,
  count(*) filter (where result = 'Loss') as loss,
  count(*) filter (where result = 'Miss') as miss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate,
  round(coalesce(sum(case when result='Win' then rr when result='Loss' then -1 else 0 end),0), 2) as total_rr,
  coalesce(max(con_loss), 0) as max_con_loss,
  coalesce(sum(case when result='Loss' then coalesce(loss_amount,0) else 0 end), 0) as total_loss_amount
from trades;

create or replace view v_dashboard_by_pair as
select
  pair,
  count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate
from trades group by pair;

create or replace view v_dashboard_by_session as
select
  session, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss
from trades where session is not null group by session;

create or replace view v_dashboard_by_setup as
select
  setup_type, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss
from trades where setup_type is not null group by setup_type;

create or replace view v_calendar_daily as
select
  trade_date, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  count(*) filter (where result = 'Miss') as miss,
  round(coalesce(sum(case when result = 'Win' then rr when result = 'Loss' then -1 else 0 end), 0), 2) as net_rr
from trades group by trade_date;

create or replace view v_by_day_of_week as
select
  extract(dow from trade_date)::int as dow,
  to_char(trade_date, 'Day') as day_name,
  count(*) as total,
  count(*) filter (where result = 'Win')  as win,
  count(*) filter (where result = 'Loss') as loss,
  count(*) filter (where result = 'Miss') as miss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate
from trades where result is not null group by dow, day_name order by dow;

create or replace view v_by_hour as
select
  extract(hour from time_entry)::int as hour, count(*) as total,
  count(*) filter (where result = 'Win')  as win,
  count(*) filter (where result = 'Loss') as loss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate
from trades where time_entry is not null and result is not null group by hour order by hour;

-- GRANTS FOR VIEWS
grant select on v_dashboard_overall to anon, authenticated;
grant select on v_dashboard_by_pair to anon, authenticated;
grant select on v_dashboard_by_session to anon, authenticated;
grant select on v_dashboard_by_setup to anon, authenticated;
grant select on v_calendar_daily to anon, authenticated;
grant select on v_by_day_of_week to anon, authenticated;
grant select on v_by_hour to anon, authenticated;

-- DONE
comment on table trades is 'TradeLog Production Master Database v3.0.0';