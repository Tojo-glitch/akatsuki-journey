-- ==============================================================================
--  TRADELOG® PRODUCTION MASTER DATABASE SCHEMA — CONSOLIDATED RECOVERY EDITION
--  VERSION: v3.0.6 (ENTERPRISE SECURITY & ANALYTICS INTEGRATION)
--  วิธีใช้: คัดลอกทั้งหมดวางใน Supabase -> SQL Editor -> Run (ครั้งเดียวจบ)
-- ==============================================================================

-- ── STEP 1: กวาดล้างและรีเซ็ตระบบเดิมทั้งหมด (WIPE & RESET SAFETY BOUNDARY) ──
drop view if exists v_access_footprint cascade;
drop view if exists v_multi_dim_expectancy cascade;
drop view if exists v_adherence_score cascade;
drop view if exists v_logging_streak cascade;
drop view if exists v_dashboard_overall cascade;
drop view if exists v_dashboard_by_pair cascade;
drop view if exists v_dashboard_by_session cascade;
drop view if exists v_dashboard_by_setup cascade;
drop view if exists v_calendar_daily cascade;
drop view if exists v_by_day_of_week cascade;
drop view if exists v_by_hour cascade;
drop view if exists v_con_loss_detail cascade;
drop view if exists v_tag_analysis cascade;

drop table if exists trade_comments cascade;
drop table if exists trades cascade;
drop table if exists app_config cascade;
drop table if exists audit_log cascade;
drop table if exists page_views cascade;
drop table if exists pin_attempts cascade;
drop table if exists owner_sessions cascade;

-- ── STEP 2: เปิดปลั๊กอินเข้ารหัสความปลอดภัยสากล ──
create extension if not exists "pgcrypto" schema extensions;

-- ── STEP 3: สร้างตารางระบบฐานข้อมูลหลัก (CORE TABLES SETUP) ──

-- 3.1 ตารางบันทึกออเดอร์ Ledger (TRADES)
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

  -- ฟิลด์คำนวณอัตโนมัติด้วย Database Triggers
  tp_r numeric,
  sl_r numeric,
  rr numeric,
  con_loss integer default 0,

  image_link text,
  video_link text,
  notes text,
  tags text[] default '{}'
);

-- ดัชนีความเร็วมิติประมวลผลสูง (Index Acceleration)
create index idx_trades_pair on trades(pair);
create index idx_trades_date on trades(trade_date desc);
create index idx_trades_result on trades(result);
create index idx_trades_session on trades(session);
create index idx_trades_entry_time on trades(time_entry);

-- 3.2 ตารางบันทึกค่าจำลองระบบ (APP_CONFIG)
create table app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- บันทึกค่าเริ่มต้นของสถิติและแฮชรหัสผ่านเริ่มต้น Bcrypt '123456'
insert into app_config (key, value) values
  ('pin_hash', extensions.crypt('123456', extensions.gen_salt('bf'))),
  ('pairs', 'XAUUSD,EURUSD,GBPUSD,USDJPY,BTCUSD'),
  ('setup_types', 'BOS,OB,FVG,Liquidity Sweep,MSS,Other'),
  ('behavior_tags', 'Planned,Revenge Trade,FOMO,Overconfident,Hesitant,Disciplined');

-- 3.3 ตารางระบบสนทนาโต้ตอบและปักหมุดจุดชาร์ตภาพ (TRADE_COMMENTS)
create table trade_comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  viewed_at timestamptz default now(),
  trade_id uuid references trades(id) on delete cascade,
  parent_id uuid references trade_comments(id) on delete cascade,
  author_name text not null,
  content text not null,
  image_url text,
  link_url text,
  status text check (status in ('Pending', 'In_Progress', 'Resolved')) default 'Pending',
  pin_x numeric, -- พิกัดแนวนอนเปอร์เซ็นต์บนรูปภาพ
  pin_y numeric, -- พิกัดแนวตั้งเปอร์เซ็นต์บนรูปภาพ
  is_read boolean default false
);

-- 3.4 ตารางบันทึกประวัติความปลอดภัยและการบุกรุกผู้ใช้ (AUDIT_LOG)
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  action text not null,
  target_pair text,
  details jsonb,
  session_id uuid,
  client_ip text
);

-- 3.5 ตารางบันทึกสถิติการเปิดดูส่องพอร์ต (PAGE_VIEWS)
create table page_views (
  id uuid primary key default gen_random_uuid(),
  viewed_at timestamptz default now(),
  page text not null,
  referrer text,
  user_agent text,
  session_id uuid,
  client_ip text
);

-- 3.6 ตารางควบคุมการเดารหัสผ่านเพื่อสกัดกั้นแฮกเกอร์ราย IP (PIN_ATTEMPTS)
create table pin_attempts (
  client_ip text primary key,
  attempts int default 0,
  locked_until timestamptz
);

-- 3.7 ตารางออกทอเคนเซสชันชั่วคราวอายุ 15 นาที (OWNER_SESSIONS)
create table owner_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- 3.8 ตารางเก็บรหัสทอเคนลับอนุญาตให้อาจารย์ส่องและคอมเมนต์ (REVIEW_TOKENS)
create table review_tokens (
  token text primary key,
  label text not null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- บันทึก Token ตรวจพอร์ตเริ่มต้นสำหรับส่งให้อาจารย์: 'mentor_secret_token_abc'
insert into review_tokens (token, label, expires_at)
values ('mentor_secret_token_abc', 'Master Mentor Account', now() + interval '1 year');

-- ── STEP 4: ระบบป้องกันความปลอดภัยสกีมา Row Level Security (RLS) ──
alter table trades enable row level security;
alter table app_config enable row level security;
alter table trade_comments enable row level security;
alter table audit_log enable row level security;
alter table page_views enable row level security;
alter table pin_attempts enable row level security;
alter table owner_sessions enable row level security;
alter table review_tokens enable row level security;

-- นโยบายเปิดให้อ่านหน้าสถิติได้แบบเป็นสาธารณะ (สิทธิ์ Read-Only สำหรับคนนอก)
create policy "Public select trades" on trades for select using (true);
create policy "Public select trade_comments" on trade_comments for select using (true);
create policy "Public select config" on app_config for select using (key not in ('pin_hash', 'reviewer_token'));
create policy "Public select review_tokens" on review_tokens for select using (true);
create policy "Public insert page_views" on page_views for insert with check (true);

-- ── STEP 5: ตรรกะฟังก์ชันสากลและการรัน TRIGGERS ดักกรอกอัตโนมัติ ──

-- 5.1 ฟังก์ชันแบ่งมิติตามคาบตลาด (Session Division)
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

-- 5.2 ฟังก์ชันลูปคำนวณและเขียนทศนิยม TP/SL/RR (ก่อนบันทึก)
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

-- 5.3 ฟังก์ชันลูปคำนวณสถิติความสูญเสียต่อเนื่อง (Consecutive Streak)
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

-- ── STEP 6: ฟังก์ชันความปลอดภัยดักกรองเครือข่ายและจำสิทธิ์ TOKEN ──

-- 6.1 ตัวดัก IP Cloudflare เกรดปลอดภัยไม่โดนสวมแฮดเดอร์
create or replace function get_client_ip()
returns text as $$
begin
  return coalesce(
    current_setting('request.headers', true)::json->>'cf-connecting-ip',
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    '127.0.0.1'
  );
end;
$$ language plpgsql stable;

-- 6.2 ตัวดักเบราว์เซอร์ผู้ใช้งาน
create or replace function get_client_user_agent()
returns text as $$
begin
  return coalesce(
    current_setting('request.headers', true)::json->>'user-agent',
    'unknown'
  );
end;
$$ language plpgsql stable;

-- 6.3 ฟังก์ชันตรวจสอบความถูกต้องของ Token เจ้าของพอร์ต (Owner session validator)
create or replace function is_valid_session(p_token uuid)
returns boolean as $$
begin
  return exists (
    select 1 from owner_sessions 
    where id = p_token and expires_at > now()
  );
end;
$$ language plpgsql stable security definer set search_path = public;

-- 6.4 ฟังก์ชันตรวจสอบ Token ของอาจารย์ในตารางจริง
create or replace function verify_reviewer_token(p_token text)
returns boolean as $$
begin
  return exists (
    select 1 from review_tokens 
    where token = p_token 
      and (expires_at is null or expires_at > now())
  );
end;
$$ language plpgsql stable security definer set search_path = public;

-- 6.5 ฟังก์ชันดักจับตัวเบราว์เซอร์สลับโหมด Reviewer
create or replace function check_reviewer_auth(p_token text)
returns json as $$
begin
  if verify_reviewer_token(p_token) then
    return json_build_object('success', true, 'message', 'Authorized');
  else
    return json_build_object('success', false, 'message', 'Invalid or expired review token');
  end if;
end;
$$ language plpgsql stable security definer set search_path = public;

-- 6.6 [วิกฤตความปลอดภัยสูงสุด]: ฟังก์ชันตรวจสอบสิทธิ์รหัสผ่าน และสกัดการเดารหัส Lockout ราย IP
create or replace function verify_pin(p_pin text, p_session_id uuid)
returns json
security definer
set search_path = public, extensions
as $$
declare
  v_ip text;
  v_ua text;
  v_attempts int;
  v_locked_until timestamptz;
  v_stored_hash text;
  v_token uuid;
begin
  v_ip := get_client_ip();
  v_ua := get_client_user_agent();
  
  select attempts, locked_until into v_attempts, v_locked_until 
  from pin_attempts where client_ip = v_ip;

  if v_locked_until is not null and v_locked_until > now() then
    insert into audit_log (action, target_pair, details, session_id, client_ip)
    values ('auth_lockout_rejected', 'SYSTEM', json_build_object('ip', v_ip, 'user_agent', v_ua)::jsonb, p_session_id, v_ip);

    return json_build_object(
      'success', false, 
      'message', 'Too many verification failures. IP blocked for ' || ceil(extract(epoch from (v_locked_until - now())) / 60) || ' minutes.'
    );
  end if;

  select value into v_stored_hash from app_config where key = 'pin_hash';

  if v_stored_hash = extensions.crypt(p_pin, v_stored_hash) then
    delete from pin_attempts where client_ip = v_ip;
    
    insert into owner_sessions (expires_at) 
    values (now() + interval '15 minutes') 
    returning id into v_token;

    insert into audit_log (action, target_pair, details, session_id, client_ip)
    values ('auth_login_success', 'SYSTEM', json_build_object('user_agent', v_ua)::jsonb, p_session_id, v_ip);

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
      else
        update pin_attempts set attempts = v_attempts where client_ip = v_ip;
      end if;
    end if;

    insert into audit_log (action, target_pair, details, session_id, client_ip)
    values ('auth_login_failed', 'SYSTEM', json_build_object('attempts_accumulated', v_attempts, 'user_agent', v_ua)::jsonb, p_session_id, v_ip);

    return json_build_object('success', false, 'message', 'Verification failed. Attempts remaining: ' || (5 - v_attempts));
  end if;
end;
$$ language plpgsql;

-- ── STEP 7: ฟังก์ชันระบบธุรกรรมควบคุมความปลอดภัย TOKEN WRITE RPCs ──

-- 7.1 บันทึกดีลการเทรด
create or replace function add_trade(p_token uuid, p_data jsonb)
returns json security definer set search_path = public, extensions as $$
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

  insert into audit_log (action, target_id, target_pair, session_id, client_ip)
  values ('add_trade', new_id, p_data->>'pair', p_token, get_client_ip());

  return json_build_object('success', true, 'message', 'Trade added successfully');
end; $$ language plpgsql;

-- 7.2 แก้ไขดีลการเทรด
create or replace function edit_trade(p_token uuid, p_id uuid, p_data jsonb)
returns json security definer set search_path = public, extensions as $$
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

  insert into audit_log (action, target_id, target_pair, session_id, client_ip)
  values ('edit_trade', p_id, p_data->>'pair', p_token, get_client_ip());

  return json_build_object('success', true, 'message', 'Trade updated successfully');
end; $$ language plpgsql;

-- 7.3 ลบดีลการเทรด
create or replace function delete_trade(p_token uuid, p_id uuid)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then
    return json_build_object('success', false, 'message', 'Session expired. Please re-authenticate.');
  end if;

  delete from trades where id = p_id;
  
  insert into audit_log (action, target_id, session_id, client_ip)
  values ('delete_trade', p_id, p_token, get_client_ip());

  return json_build_object('success', true, 'message', 'Trade deleted');
end; $$ language plpgsql;

-- 7.4 อัปเดตสถานะแพ้ชนะด่วน
create or replace function quick_update_result(p_token uuid, p_id uuid, p_result text)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then
    return json_build_object('success', false, 'message', 'Session expired. Please re-authenticate.');
  end if;

  update trades set result = p_result where id = p_id;
  return json_build_object('success', true, 'message', 'Result updated');
end; $$ language plpgsql;

-- 7.5 บันทึกคู่เงิน
create or replace function save_pairs(p_token uuid, p_pairs text)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Session expired'); end if;
  update app_config set value = p_pairs, updated_at = now() where key = 'pairs';
  return json_build_object('success', true, 'message', 'Pairs saved');
end; $$ language plpgsql;

-- 7.6 บันทึกกลยุทธ์ Setup
create or replace function save_setup_types(p_token uuid, p_setups text)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Session expired'); end if;
  update app_config set value = p_setups, updated_at = now() where key = 'setup_types';
  return json_build_object('success', true, 'message', 'Setup types saved');
end; $$ language plpgsql;

-- 7.7 บันทึกแท็กพฤติกรรม
create or replace function save_behavior_tags(p_token uuid, p_tags text)
returns json security definer set search_path = public, extensions as $$
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Session expired'); end if;
  update app_config set value = p_tags, updated_at = now() where key = 'behavior_tags';
  return json_build_object('success', true, 'message', 'Tags saved');
end; $$ language plpgsql;

-- 7.8 เปลี่ยนรหัส PIN ดับเบิ้ลเซสชันค้าง
create or replace function change_pin(p_token uuid, p_old_pin text, p_new_pin text)
returns json security definer set search_path = public, extensions as $$
declare
  v_stored_hash text;
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Session expired'); end if;
  
  select value into v_stored_hash from app_config where key = 'pin_hash';
  if v_stored_hash != crypt(p_old_pin, v_stored_hash) then
    return json_build_object('success', false, 'message', 'Wrong current PIN');
  end if;
  if length(p_new_pin) != 6 or p_new_pin !~ '^[0-9]+$' then
    return json_build_object('success', false, 'message', 'PIN must be exactly 6 digits');
  end if;
  
  update app_config set value = crypt(p_new_pin, gen_salt('bf')), updated_at = now() where key = 'pin_hash';
  delete from owner_sessions; -- ตัดอายุกวาดเซสชันออกให้หมดทันทีเพื่อบังคับล็อกอินใหม่
  return json_build_object('success', true, 'message', 'PIN changed successfully');
end; $$ language plpgsql;

-- 7.9 บันทึกความคิดเห็นของอาจารย์พร้อมพิกัดชาร์ต
create or replace function add_comment(
  p_token text,
  p_trade_id uuid,
  p_author text,
  p_content text,
  p_image text default null,
  p_link text default null,
  p_parent_id uuid default null,
  p_status text default 'Pending',
  p_pin_x numeric default null,
  p_pin_y numeric default null
)
returns json security definer set search_path = public, extensions as $$
begin
  if not verify_reviewer_token(p_token) and not is_valid_session(nullif(p_token, '')::uuid) then
    return json_build_object('success', false, 'message', 'Unauthorized: Invalid review token or session.');
  end if;

  insert into trade_comments (trade_id, author_name, content, image_url, link_url, parent_id, status, pin_x, pin_y)
  values (p_trade_id, p_author, p_content, nullif(p_image, ''), nullif(p_link, ''), p_parent_id, p_status, p_pin_x, p_pin_y);

  return json_build_object('success', true, 'message', 'Comment submitted successfully.');
end; $$ language plpgsql;

-- 7.10 ทำลายสัญญาน "ยังไม่ได้อ่าน" ของคอมเมนต์รายเทรด
create or replace function mark_comments_read(p_token uuid, p_trade_id uuid)
returns json security definer set search_path = public as $$
begin
  if not is_valid_session(p_token) then return json_build_object('success', false, 'message', 'Unauthorized session'); end if;
  update trade_comments set is_read = true where trade_id = p_trade_id;
  return json_build_object('success', true);
end; $$ language plpgsql;

-- ── STEP 8: สถิติด้านแผนภูมิคณิตศาสตร์ (DATABASE VIEWS SETUP) ──

-- 8.1 ภาพรวมสถิติพอร์ตหลัก
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

-- 8.2 สถิติแบ่งรายคู่สกุลเงิน
create or replace view v_dashboard_by_pair as
select
  pair, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate
from trades group by pair;

-- 8.3 สถิติแบ่งรายคาบเวลาตลาด
create or replace view v_dashboard_by_session as
select
  session, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss
from trades where session is not null group by session;

-- 8.4 สถิติแบ่งรายแผนกลยุทธ์ Setup
create or replace view v_dashboard_by_setup as
select
  setup_type, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss
from trades where setup_type is not null group by setup_type;

-- 8.5 แผงรวมเงินรายวันตามตารางปฏิทิน
create or replace view v_calendar_daily as
select
  trade_date, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  count(*) filter (where result = 'Miss') as miss,
  round(coalesce(sum(case when result = 'Win' then rr when result = 'Loss' then -1 else 0 end), 0), 2) as net_rr
from trades group by trade_date;

-- 8.6 สถิติสแกนเปรียบเทียบตามชื่อวันในรอบสัปดาห์
create or replace view v_by_day_of_week as
select
  extract(dow from trade_date)::int as dow,
  trim(to_char(trade_date, 'Day')) as day_name,
  count(*) as total,
  count(*) filter (where result = 'Win')  as win,
  count(*) filter (where result = 'Loss') as loss,
  count(*) filter (where result = 'Miss') as miss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate
from trades where result is not null group by dow, day_name order by dow;

-- 8.7 แผนที่ความร้อนสถิติรายชั่วโมง
create or replace view v_by_hour as
select
  extract(hour from time_entry)::int as hour, count(*) as total,
  count(*) filter (where result = 'Win')  as win,
  count(*) filter (where result = 'Loss') as loss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate
from trades where time_entry is not null and result is not null group by hour order by hour;

-- 8.8 สรุปค่าปรับความเสียหายของสถิติต่อเนื่อง
create or replace view v_con_loss_detail as
select
  pair, max(con_loss) as max_con_loss,
  sum(case when result = 'Loss' then coalesce(loss_amount, 0) else 0 end) as total_loss_amount,
  count(*) filter (where result = 'Loss') as total_losses
from trades group by pair;

-- 8.9 วิเคราะห์สถิติจิตวิทยาพฤติกรรม Tag
create or replace view v_tag_analysis as
select
  unnest(tags) as tag, count(*) as total,
  count(*) filter (where result = 'Win') as win,
  count(*) filter (where result = 'Loss') as loss,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate
from trades group by tag;

-- 8.10 เส้นโค้งกำไรขาดทุน Drawdown มิติสะสมพอร์ต
create or replace view v_equity_drawdown as
with ordered_trades as (
  select 
    id, trade_date, pair, result,
    case when result = 'Win' then coalesce(rr, 1) when result = 'Loss' then -1 else 0 end as trade_r,
    row_number() over (order by trade_date asc, created_at asc) as x
  from trades where result is not null and result in ('Win','Loss')
),
running_equity as (
  select 
    x, trade_date, pair, result,
    sum(trade_r) over (order by x asc) as equity
  from ordered_trades
),
peak_calc as (
  select 
    x, trade_date, pair, result, equity,
    max(equity) over (order by x asc) as peak
  from running_equity
)
select 
  x, trade_date, pair, result, equity, peak,
  round(equity - peak, 2) as drawdown
from peak_calc order by x asc;

-- 8.11 🌟 [INSIGHT ENGINE]: วิเคราะห์สถิติไขว้ข้ามพิกเซลดึงจุดแข็งจุดรั่วไหล
create or replace view v_multi_dim_expectancy as
select
  pair, session,
  trim(to_char(trade_date, 'Day')) as day_name,
  extract(dow from trade_date)::int as dow,
  count(*) as total_trades,
  count(*) filter (where result = 'Win') as wins,
  count(*) filter (where result = 'Loss') as losses,
  count(*) filter (where result = 'Miss') as misses,
  round(100.0 * count(*) filter (where result = 'Win') /
    nullif(count(*) filter (where result in ('Win','Loss')), 0), 1) as win_rate,
  round(coalesce(sum(case when result = 'Win' then rr when result = 'Loss' then -1 else 0 end), 0), 2) as total_rr,
  round(coalesce(sum(case when result = 'Win' then rr when result = 'Loss' then -1 else 0 end), 0) /
    nullif(count(*), 0)::numeric, 2) as expectancy_r
from trades where result is not null and result in ('Win', 'Loss') and session is not null
group by pair, session, day_name, dow;

-- 8.12 🌟 [ADHERENCE INDEX]: ตรวจคะแนนประเมินวินัยเทรดเดอร์ในภาพรวม
create or replace view v_adherence_score as
with trade_eval as (
  select t.id,
    exists (
      select 1 from v_multi_dim_expectancy m
      where m.pair = t.pair and m.session = t.session 
        and m.day_name = trim(to_char(t.trade_date, 'Day')) and m.expectancy_r > 0
    ) as is_adherent
  from trades t where t.result is not null and t.result in ('Win', 'Loss')
)
select
  count(*) as total_evaluated_trades,
  count(*) filter (where is_adherent) as disciplined_trades,
  round(100.0 * count(*) filter (where is_adherent) / nullif(count(*), 0), 1) as adherence_score_pct
from trade_eval;

-- 8.13 🌟 [HABIT LOOP STREAK]: ตารางคำนวณวันบันทึกสถิติมั่งคั่งต่อเนื่องสะสม
create or replace view v_logging_streak as
with date_series as (
  select distinct trade_date from trades order by trade_date desc
),
streak_calc as (
  select trade_date,
    trade_date - (row_number() over (order by trade_date desc))::int as group_id
  from date_series
)
select count(*) as current_streak_days
from streak_calc
where group_id = (select group_id from streak_calc limit 1)
group by group_id;

-- 8.14 🌟 [DATA HYGIENE CHECK]: ตัวคัดกรองออเดอร์ผีที่ลืมคีย์สรุปพอร์ต
create or replace view v_data_hygiene_stale as
select id, trade_date, pair, direction, entry_price, stop_loss, notes
from trades where result is null and trade_date < (now() - interval '7 days')::date
order by trade_date asc;

-- 8.15 🌟 [SECURITY LOGS]: ตารางสืบสวนรอยเท้าประวัติความเคลื่อนไหวความปลอดภัยหนึ่งเดียว
create or replace view v_access_footprint as
select 
  viewed_at as event_time, client_ip, session_id,
  'VIEW_PAGE' as type, page as action, 'PUBLIC' as target, null::jsonb as details
from page_views
union all
select
  created_at as event_time, client_ip, session_id,
  'ADMIN_ACTION' as type, action, coalesce(target_pair, 'SYSTEM') as target, details
from audit_log
order by event_time desc;

-- ── STEP 9: มอบสิทธิ์การเข้าใช้งานระบบวิเคราะห์วิจัยทั้งหมดให้ API ──
grant select on v_dashboard_overall to anon, authenticated;
grant select on v_dashboard_by_pair to anon, authenticated;
grant select on v_dashboard_by_session to anon, authenticated;
grant select on v_dashboard_by_setup to anon, authenticated;
grant select on v_calendar_daily to anon, authenticated;
grant select on v_by_day_of_week to anon, authenticated;
grant select on v_by_hour to anon, authenticated;
grant select on v_con_loss_detail to anon, authenticated;
grant select on v_tag_analysis to anon, authenticated;
grant select on v_equity_drawdown to anon, authenticated;
grant select on v_multi_dim_expectancy to anon, authenticated;
grant select on v_adherence_score to anon, authenticated;
grant select on v_logging_streak to anon, authenticated;
grant select on v_data_hygiene_stale to anon, authenticated;
grant select on v_access_footprint to anon, authenticated;

grant execute on function verify_pin(text, uuid) to anon, authenticated;
grant execute on function change_pin(text, text) to anon, authenticated;
grant execute on function save_pairs(text, text) to anon, authenticated;
grant execute on function save_setup_types(text, text) to anon, authenticated;
grant execute on function save_behavior_tags(text, text) to anon, authenticated;
grant execute on function add_comment(text, uuid, text, text, text, text, uuid, text, numeric, numeric) to anon, authenticated;
grant execute on function mark_comments_read(uuid, uuid) to anon, authenticated;
grant execute on function quick_update_result(uuid, uuid, text) to anon, authenticated;

-- ==============================================================================
--  TRADELOG MASTER RECOVERY SCRIPTS COMPILED SUCCESSFUL ✓
-- ==============================================================================
comment on table trades is 'TradeLog Master DB Recovery Manifest System v3.0.6';