-- ============================================================
-- 트러블슈팅 가이드 - Seed Data (CMP 설비 기준)
-- schema.sql 실행 후에 실행하세요.
-- ============================================================

USE cmpbeol;

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
INSERT INTO troubleshooting_steps (guide_id, step_order, description)
VALUES
(@g, 1, '슬러리 공급 라인의 압력 게이지를 확인한다. 공급 압력이 정상 범위인지 점검한다. (슬러리 라인 개방 시 분출 주의, 보호구 착용)'),
(@g, 2, '슬러리 필터 차압 게이지를 확인하고 클로깅 여부를 판단한다.'),
(@g, 3, '다이어프램 펌프 동작 상태를 확인하고 필요 시 재기동한다. 유량이 회복되는지 확인한다.');

-- ALM-2002 (Ebara) : Head Motor Overload
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='ALARM' AND equipment_model='Ebara' AND code='ALM-2002');
INSERT INTO troubleshooting_steps (guide_id, step_order, description)
VALUES
(@g, 1, '설비를 안전 정지하고 헤드 회전부의 이상음/걸림을 육안 점검한다. (모터 과열 상태에서 재기동 금지, 충분히 냉각)'),
(@g, 2, '다운포스를 정상 범위로 재설정하고 무부하 시운전한다. 시운전이 정상인지 확인한다.');

-- ALM-4004 (LKP) : DIW Temperature High
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='ALARM' AND equipment_model='LKP' AND code='ALM-4004');
INSERT INTO troubleshooting_steps (guide_id, step_order, description)
VALUES
(@g, 1, 'DIW 온도센서 지시값과 실측값을 비교한다. (고온 DIW 접촉 화상 주의)'),
(@g, 2, '냉각수 유량 및 공급 상태를 확인하고 정상화한다.');

-- ILK-5001 (Mirra) : EMO Activated
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='INTERLOCK' AND equipment_model='Mirra' AND code='ILK-5001');
INSERT INTO troubleshooting_steps (guide_id, step_order, description)
VALUES
(@g, 1, '설비 주변 인원 및 이상 상태를 확인한다. (모든 위험요소 제거 후에만 진행)'),
(@g, 2, '눌린 EMO 버튼을 복귀하고 안전회로 정상 확인 후 규정 절차로 재기동한다. (안전 담당자 확인 완료 후에만 리셋)');

-- DOOR_OPEN_INT (LK) : Door Open Interlock
SET @g := (SELECT id FROM troubleshooting_guides WHERE guide_type='INTERLOCK' AND equipment_model='LK' AND code='DOOR_OPEN_INT');
INSERT INTO troubleshooting_steps (guide_id, step_order, description)
VALUES
(@g, 1, 'Door sensor LED 상태를 확인한다. (Door 개방 시 안전에 유의)'),
(@g, 2, '내부 인원/공구 잔류를 확인하고 도어를 완전히 닫은 뒤 리셋한다. (내부 안전 확인 필수)');
