-- ============================================================
-- 트러블슈팅 가이드 - Seed Data (CMP 설비 기준)
-- schema.sql 실행 후에 실행하세요.
-- ============================================================

USE cmp_guide;

-- ------------------------------------------------------------
-- 가이드 (알람 3건 + 인터락 2건)
-- ------------------------------------------------------------
INSERT INTO troubleshooting_guides (guide_type, equipment_model, process_area, code, title, summary)
VALUES
('ALARM', 'Mirra', 'CMP', 'ALM-1001', 'Slurry Flow Low',
 '슬러리 공급 유량이 설정 하한값 이하로 감소했을 때의 조치 가이드'),
('ALARM', 'Ebara', 'CMP', 'ALM-2002', 'Head Motor Overload',
 '폴리싱 헤드 구동 모터 부하가 정격치를 초과했을 때의 조치 가이드'),
('ALARM', 'LKP', 'Clean', 'ALM-4004', 'DIW Temperature High',
 '세정부 초순수(DIW) 온도가 상한을 초과했을 때의 조치 가이드'),
('INTERLOCK', 'Mirra', 'CMP', 'ILK-5001', 'EMO Activated',
 '비상정지(EMO) 작동으로 설비가 정지되었을 때의 조치 가이드'),
('INTERLOCK', 'LK', 'CMP', 'DOOR_OPEN_INT', 'Door Open Interlock',
 '메인 도어 개방으로 구동부 동작이 금지되었을 때의 조치 가이드');

-- ------------------------------------------------------------
-- Steps
-- ------------------------------------------------------------

-- ALM-1001 (Mirra) : Slurry Flow Low
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='ALARM' AND equipment_model='Mirra' AND code='ALM-1001');
INSERT INTO troubleshooting_steps
  (guide_id, step_order, step_title, description, decision_question, normal_result_text, next_step_order, caution)
VALUES
(@g, 1, '슬러리 공급 압력 확인', '슬러리 공급 라인의 압력 게이지를 확인한다.',
 '공급 압력이 정상 범위인가요?', '압력 정상. 유량계 표시값을 확인하세요.', 2, '슬러리 라인 개방 시 분출 주의, 보호구 착용.'),
(@g, 2, '필터 차압 확인', '슬러리 필터 차압 게이지를 확인하고 클로깅 여부를 판단한다.',
 '필터 차압이 정상 범위인가요?', '필터 정상. 펌프 동작을 확인하세요.', 3, NULL),
(@g, 3, '펌프 상태 확인 및 재기동', '다이어프램 펌프 동작 상태를 확인하고 필요 시 재기동한다.',
 '펌프 재기동 후 유량이 회복되었나요?', '유량 정상 회복. 조치 완료.', NULL, '해결되지 않으면 설비 담당자에게 문의하세요.');

-- ALM-2002 (Ebara) : Head Motor Overload
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='ALARM' AND equipment_model='Ebara' AND code='ALM-2002');
INSERT INTO troubleshooting_steps
  (guide_id, step_order, step_title, description, decision_question, normal_result_text, next_step_order, caution)
VALUES
(@g, 1, '헤드 회전 이상음 확인', '설비를 안전 정지하고 헤드 회전부의 이상음/걸림을 육안 점검한다.',
 '기계적 걸림이나 이상음이 없나요?', '기계부 정상. 다운포스 설정을 확인하세요.', 2, '모터 과열 상태에서 재기동 금지, 충분히 냉각.'),
(@g, 2, '다운포스 재설정 및 시운전', '다운포스를 정상 범위로 재설정하고 무부하 시운전한다.',
 '무부하 시운전이 정상인가요?', '정상 확인. 조치 완료.', NULL, '리테이너 링/베어링 마모 의심 시 담당자 문의.');

-- ALM-4004 (LKP) : DIW Temperature High
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='ALARM' AND equipment_model='LKP' AND code='ALM-4004');
INSERT INTO troubleshooting_steps
  (guide_id, step_order, step_title, description, decision_question, normal_result_text, next_step_order, caution)
VALUES
(@g, 1, 'DIW 온도센서 확인', 'DIW 온도센서 지시값과 실측값을 비교한다.',
 '센서 지시값이 실측과 일치하나요?', '센서 정상. 냉각수 공급을 확인하세요.', 2, '고온 DIW 접촉 화상 주의.'),
(@g, 2, '냉각수 공급 확인', '냉각수 유량 및 공급 상태를 확인하고 정상화한다.',
 '냉각수 공급이 정상인가요?', '냉각 정상. 조치 완료.', NULL, NULL);

-- ILK-5001 (Mirra) : EMO Activated
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='INTERLOCK' AND equipment_model='Mirra' AND code='ILK-5001');
INSERT INTO troubleshooting_steps
  (guide_id, step_order, step_title, description, decision_question, normal_result_text, next_step_order, caution)
VALUES
(@g, 1, '설비 주변 안전 확인', '설비 주변 인원 및 이상 상태를 확인한다.',
 '설비 주변이 안전한 상태인가요?', '안전 확인됨. 눌린 EMO 버튼을 확인하세요.', 2, '모든 위험요소 제거 후에만 진행.'),
(@g, 2, 'EMO 버튼 복귀 및 재기동', '눌린 EMO 버튼을 복귀하고 안전회로 정상 확인 후 규정 절차로 재기동한다.',
 '안전회로가 정상 복귀되었나요?', '정상 복귀. 규정 절차에 따라 재기동하세요.', NULL, '안전 담당자 확인 완료 후에만 리셋.');

-- DOOR_OPEN_INT (LK) : Door Open Interlock
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='INTERLOCK' AND equipment_model='LK' AND code='DOOR_OPEN_INT');
INSERT INTO troubleshooting_steps
  (guide_id, step_order, step_title, description, decision_question, normal_result_text, next_step_order, caution)
VALUES
(@g, 1, 'Door Sensor 상태 확인', 'Door sensor LED 상태를 확인한다.',
 'Sensor LED가 정상 점등 상태인가요?', '정상으로 판단되어 추가 조치가 필요하지 않습니다.', 2, 'Door 개방 시 안전에 유의.'),
(@g, 2, 'Door 폐쇄 및 리셋', '내부 인원/공구 잔류를 확인하고 도어를 완전히 닫은 뒤 리셋한다.',
 '도어 스위치 신호가 정상인가요?', '정상 확인. 조치 완료.', NULL, '내부 안전 확인 필수.');
