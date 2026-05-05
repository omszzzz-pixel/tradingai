-- Migration 006: 단타/스윙 → 공격형/보수형 (trading style → personality)
-- AI 봇은 매매를 하지 않고 스탠스만 내므로 매매 시간 horizon 라벨 대신 분석 성향 라벨로 변경
-- 의존 테이블(decisions/trades 등 dead code) FK 일시 해제 후 일괄 업데이트

-- 0. agents.id를 참조하는 모든 FK 일시 해제 (Plan B로 비활성화된 trade/decision 테이블 잔재 포함)
do $$
declare
  fk record;
begin
  for fk in
    select tc.table_name, tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
    where tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_name = 'agents'
      and ccu.column_name = 'id'
  loop
    execute format('alter table %I drop constraint %I', fk.table_name, fk.constraint_name);
  end loop;
end $$;

-- 1. style check 제약 해제
alter table agents drop constraint if exists agents_style_check;

-- 2. style 값 매핑: scalp → aggressive, swing → conservative
update agents set style = 'aggressive'   where style = 'scalp';
update agents set style = 'conservative' where style = 'swing';

-- 3. id 슬러그 매핑: -scalp → -aggressive, -swing → -conservative
update agents set id = replace(id, '-scalp', '-aggressive')   where id like '%-scalp';
update agents set id = replace(id, '-swing', '-conservative') where id like '%-swing';

-- 4. display_name 한글 라벨: 단타 → 공격형, 스윙 → 보수형
update agents set display_name = replace(display_name, '단타', '공격형') where display_name like '%단타%';
update agents set display_name = replace(display_name, '스윙', '보수형') where display_name like '%스윙%';

-- 5. 의존 테이블 agent_id 동기화 (FK 없는 stance_outcomes + 있었던 decisions/trades 등)
--    information_schema로 agent_id 컬럼을 가진 모든 테이블을 찾아 update
do $$
declare
  t record;
begin
  for t in
    select table_name
    from information_schema.columns
    where column_name = 'agent_id' and table_schema = 'public'
  loop
    execute format(
      $sql$update %I set agent_id = replace(agent_id, '-scalp', '-aggressive') where agent_id like '%%-scalp'$sql$,
      t.table_name
    );
    execute format(
      $sql$update %I set agent_id = replace(agent_id, '-swing', '-conservative') where agent_id like '%%-swing'$sql$,
      t.table_name
    );
  end loop;
end $$;

-- 6. messages.display_name 한글 라벨도 동기화 (예: "Claude Sonnet 단타" → "Claude Sonnet 공격형")
update messages set display_name = replace(display_name, '단타', '공격형') where display_name like '%단타%' and is_bot = true;
update messages set display_name = replace(display_name, '스윙', '보수형') where display_name like '%스윙%' and is_bot = true;

-- 7. 새 check 제약 재설정
alter table agents add constraint agents_style_check check (style in ('aggressive','conservative'));

-- 8. FK 재생성은 생략 — Plan B로 decisions/trades 테이블은 더 이상 사용되지 않음.
--    필요 시 별도 마이그레이션으로 dead 테이블 자체 삭제 권장.
