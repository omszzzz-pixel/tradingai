-- Migration 006: 단타/스윙 → 공격형/보수형 (trading style → personality)
-- AI 봇은 매매를 하지 않고 스탠스만 내므로 매매 시간 horizon 라벨 대신 분석 성향 라벨로 변경

-- 1. 기존 check 제약 해제
alter table agents drop constraint if exists agents_style_check;

-- 2. style 값 매핑: scalp → aggressive, swing → conservative
update agents set style = case when style = 'scalp' then 'aggressive' else 'conservative' end;

-- 3. id 슬러그 매핑: -scalp → -aggressive, -swing → -conservative
update agents set id = replace(id, '-scalp', '-aggressive') where id like '%-scalp';
update agents set id = replace(id, '-swing', '-conservative') where id like '%-swing';

-- 4. display_name 한글 라벨: 단타 → 공격형, 스윙 → 보수형
update agents set display_name = replace(display_name, '단타', '공격형') where display_name like '%단타%';
update agents set display_name = replace(display_name, '스윙', '보수형') where display_name like '%스윙%';

-- 5. stance_outcomes.agent_id 동기화 (text 컬럼, FK 없음)
update stance_outcomes set agent_id = replace(agent_id, '-scalp', '-aggressive') where agent_id like '%-scalp';
update stance_outcomes set agent_id = replace(agent_id, '-swing', '-conservative') where agent_id like '%-swing';

-- 6. messages.display_name 한글 라벨도 동기화 (예: "Claude Sonnet 단타" → "Claude Sonnet 공격형")
update messages set display_name = replace(display_name, '단타', '공격형') where display_name like '%단타%' and is_bot = true;
update messages set display_name = replace(display_name, '스윙', '보수형') where display_name like '%스윙%' and is_bot = true;

-- 7. 새 check 제약 재설정
alter table agents add constraint agents_style_check check (style in ('aggressive','conservative'));
