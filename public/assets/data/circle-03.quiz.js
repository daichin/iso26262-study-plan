window.ISO26262_QUIZ_CIRCLE_03 = [
  {
    id: 'c03-q1',
    question: '一個 ASIL D 的安全需求，透過 ASIL decomposition 拆成兩條各自為 ASIL B(D) 的冗餘路徑。這個分解合法的前提是什麼？',
    options: [
      '只要兩條路徑都各自完成 ASIL B 等級的開發流程即可，不需要額外證明',
      '兩條路徑必須滿足 independence（獨立性），不會因為同一個原因同時失效',
      '兩條路徑必須使用完全相同的硬體元件以確保一致性',
      'ASIL decomposition 只能在硬體層使用，不適用於軟體'
    ],
    correctIndex: 1,
    explanation: 'ASIL decomposition 的核心前提是兩條（或多條）分解出來的路徑必須彼此獨立，不會被同一個共因或串聯事件一起搞掛，否則分解出來的低 ASIL 路徑組合起來無法真正達到原本的 ASIL D 保證。',
    sourceKey: 'iso26262_part9',
  },
  {
    id: 'c03-q2',
    question: '路徑標記為「ASIL B(D)」，這裡的 (D) 代表什麼意思？',
    options: [
      '這條路徑本身天生的開發等級是 ASIL D',
      '這條路徑是為了滿足原始 ASIL D 需求，透過分解而來，其開發嚴謹度是 ASIL B',
      '(D) 是一個字母編號，沒有特別意義',
      '代表這條路徑已經完全等同於一條獨立的 ASIL D 系統'
    ],
    correctIndex: 1,
    explanation: '括號中的字母表示這個分解路徑所服務的原始安全需求等級，路徑本身按照 ASIL B 的嚴謹度開發，但整體目標仍是滿足原本的 ASIL D 需求。',
    sourceKey: 'iso26262_part9',
  },
  {
    id: 'c03-q3',
    question: '在同一顆 MCU 上同時跑 ASIL D 與 QM（無安全等級）任務，要達成 freedom from interference，下列哪一項不是常見的干擾管道？',
    options: [
      '記憶體干擾：QM 任務寫壞 ASIL D 任務的記憶體',
      '時間干擾：QM 任務佔用過多 CPU 時間，讓 ASIL D 任務錯過 deadline',
      '交換資訊干擾：透過共用旗標或通訊介面傳遞錯誤資料',
      'MCU 型號差異：兩個任務使用不同型號的 MCU'
    ],
    correctIndex: 3,
    explanation: 'Freedom from interference 討論的是「同一顆 MCU 上」不同 ASIL 元件之間的干擾管道，常見的是記憶體、時間、交換資訊三種；不同型號 MCU 屬於不同硬體，不在這個討論範圍內。',
    sourceKey: 'iso26262_part9',
  },
  {
    id: 'c03-q4',
    question: '要在同一顆 MCU 上實現高 ASIL 任務與低 ASIL 任務之間的記憶體與時間隔離，最典型的硬體/系統手段是什麼？',
    options: [
      '提高 CPU 時脈頻率',
      '使用 MPU（記憶體保護單元）搭配 RTOS 的時間分區（time partitioning）',
      '把所有任務都寫成同一個無窮迴圈',
      '增加更多的 log 輸出方便除錯'
    ],
    correctIndex: 1,
    explanation: 'MPU 提供記憶體隔離，RTOS 的時間分區機制則保證高 ASIL 任務的 CPU 時間配額不會被低 ASIL 任務搶走，這是實現 freedom from interference 最常見的系統設計手段。',
    sourceKey: 'iso26262_part9',
  },
  {
    id: 'c03-q5',
    question: '「Common cause failure（共因失效）」最貼切的描述是？',
    options: [
      '兩個原本被認為獨立的元件，因為單一共同原因（例如同一次電源突波）而同時失效',
      '一個元件失效後，直接觸發另一個元件跟著失效',
      '因為程式碼註解寫得不夠清楚而導致的失效',
      '單純的硬體老化磨損'
    ],
    correctIndex: 0,
    explanation: 'Common cause failure 指的是單一根本原因同時讓兩個原本認為獨立的元件失效；一個元件失效直接觸發另一個失效則屬於 cascading failure（串聯失效），是另一種相依失效型態。',
    sourceKey: 'iso26262_part9',
  },
  {
    id: 'c03-q6',
    question: '團隊宣稱兩條路徑「彼此獨立」，但沒有做任何 dependent failure analysis 就直接採用 ASIL decomposition。這樣做的問題是什麼？',
    options: [
      '沒有問題，只要兩條路徑程式碼不同就代表獨立',
      '獨立性的宣稱必須透過相依失效分析驗證，否則共因失效或串聯失效的風險未被排除，分解的安全論證不完整',
      'Dependent failure analysis 只在硬體層需要，軟體路徑不需要',
      '這樣做只會影響開發成本，不影響安全論證的有效性'
    ],
    correctIndex: 1,
    explanation: '獨立性不能只憑「程式碼不同」就假設成立，必須透過 dependent failure analysis 具體檢視共因失效與串聯失效的可能路徑，否則 ASIL decomposition 或 freedom from interference 的安全論證會有漏洞。',
    sourceKey: 'iso26262_part9',
  },
];
