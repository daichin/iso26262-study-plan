window.ISO26262_QUIZ_CIRCLE_02 = [
  {
    id: 'c02-q1',
    question: '在 change management（變更管理）流程中，收到一個變更請求後，下一步最先該做什麼？',
    options: [
      '直接修改程式碼並提交',
      '進行 impact analysis（影響分析），找出受影響的需求、設計與測試案例',
      '先跑完整套回歸測試',
      '通知客戶這項變更'
    ],
    correctIndex: 1,
    explanation: 'ISO 26262-8 要求任何變更都要先做影響分析，釐清波及範圍，再決定要核准哪些後續驗證動作，而不是直接動手改或憑經驗判斷影響範圍。',
    sourceKey: 'iso26262_part8',
  },
  {
    id: 'c02-q2',
    question: '關於 walkthrough、review、inspection 三種驗證方法，下列敘述何者正確？',
    options: [
      '三者可以互相替代，選哪個純粹看個人喜好',
      'Inspection 是最正式的一種，通常要求獨立審查者與明確準則，用於較高 ASIL 的關鍵產出物',
      'Walkthrough 一定要有獨立審查者參與',
      'Review 不需要任何紀錄'
    ],
    correctIndex: 1,
    explanation: 'Inspection 是三者中最正式的驗證方法，強調獨立性與結構化的缺陷紀錄，常用於高 ASIL 情境；walkthrough 較非正式，由作者主導講解。',
    sourceKey: 'iso26262_part8',
  },
  {
    id: 'c02-q3',
    question: '在工具信心等級（TCL）判定流程中，如果一個工具被判定為 TI2，代表什麼？',
    options: [
      '這個工具的錯誤輸出不可能影響安全相關產品，或即使有影響也能被其他方式偵測/防止，因此直接落在 TCL1，不需要額外鑑定',
      '這個工具一定需要做 TCL3 等級的鑑定',
      'TI2 代表工具本身有已知的重大缺陷',
      'TI2 只適用於硬體工具，不適用於軟體工具'
    ],
    correctIndex: 0,
    explanation: 'TI（Tool Impact）判定的是工具錯誤輸出是否可能影響安全相關產品且無法被其他方式偵測。TI2 代表不會有這種未被偵測的影響，因此不需要再往下判斷 TD，直接屬於 TCL1。',
    sourceKey: 'iso26262_part8',
  },
  {
    id: 'c02-q4',
    question: '如果一個工具被判定為 TI1（有可能造成未被偵測的安全性影響），且對於偵測/防止該錯誤的信心程度是「中」（TD2），最終的 TCL 等級是？',
    options: ['TCL1', 'TCL2', 'TCL3', '不需要判定 TCL'],
    correctIndex: 1,
    explanation: 'TI1 加上 TD2（中等信心）對應到 TCL2，代表這個工具需要採取鑑定措施，例如使用記錄佐證、評估工具開發流程或額外驗證。',
    sourceKey: 'iso26262_part8',
  },
  {
    id: 'c02-q5',
    question: '團隊想直接沿用一套現成的第三方通訊協定堆疊（並非依 ISO 26262 開發），下列做法何者符合 Part 8 的要求？',
    options: [
      '因為業界廣泛使用，可以直接假設沒問題並整合進安全相關系統',
      '需要透過元件鑑定手段（如既有使用記錄、額外測試或分析）建立對這個元件的信心後才能使用',
      '只要簽署免責聲明就可以使用',
      '完全禁止使用任何非依 ISO 26262 開發的第三方元件'
    ],
    correctIndex: 1,
    explanation: 'Qualification of software components 要求對非依標準開發的既有元件，透過使用記錄、額外測試或分析等鑑定手段建立信心，而不是單純假設「大家都在用就沒問題」，也不是完全禁止重用。',
    sourceKey: 'iso26262_part8',
  },
  {
    id: 'c02-q6',
    question: '為什麼安全專案往往會鎖定特定的編譯器版本，不輕易升級到最新版？',
    options: [
      '因為新版編譯器一定比較慢',
      '因為換版本理論上等於換了一個新工具，先前針對該版本做的工具鑑定（如果該工具被判定為 TCL2 以上）需要重新評估是否仍然成立',
      '因為新版編譯器不支援 C 語言',
      '純粹是採購流程的限制，跟技術無關'
    ],
    correctIndex: 1,
    explanation: '若編譯器被判定為 TCL2 以上並已完成鑑定措施，鑑定結果是針對「當時那個特定版本」成立的；升級版本等於引入一個未被鑑定過的新工具狀態，需要重新評估。',
    sourceKey: 'iso26262_part8',
  },
];
