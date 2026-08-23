/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  id: string;
  name: string;
  lessonNumber: number;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedStudyTime: number; // in minutes
  estimatedRevisionTime: number; // in minutes
  relatedLessons: string[];
  prerequisites: string[];
  keywords: string[];
  concepts: string[];
  officialLearningOutcomes: string[];
  requiredSkills?: string[];
  officialReferences?: string[];
}

export interface Unit {
  unitNumber: number;
  name: string;
  lessons: Lesson[];
}

export interface CurriculumSubject {
  id: string; // unique ID e.g. third_arabic_science_chemistry
  name: string;
  academicYear: 'first' | 'second' | 'third';
  curriculumTrack: 'arabic' | 'languages';
  specialization: 'science' | 'math' | 'literature' | 'general';
  color: string;
  icon: string;
  maxScore: number;
  units: Unit[];
}

export interface CurriculumMetadata {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  source: string;
  supportedTracks: string[];
  academicYears: string[];
  specializations: string[];
}

export const CURRICULUM_METADATA: CurriculumMetadata = {
  id: 'egyptian_thanaweya',
  name: 'Egyptian Thanaweya Amma (الصف الثالث والسنوات العامة)',
  version: '2027.5',
  lastUpdated: new Date().toISOString(),
  source: 'Egyptian Ministry of Education',
  supportedTracks: ['arabic', 'languages'],
  academicYears: ['first', 'second', 'third'],
  specializations: ['science', 'math', 'literature']
};

// ==========================================
// CURRICULUM UNITS GENERATORS
// ==========================================

function getEnglishUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: isLang ? 'Unit 1: Read All About It! (Reporting & Tenses)' : 'الوحدة الأولى: الصحافة والأزمنة وحقوق الملكية',
      lessons: [
        {
          id: 'eng_u1_l1',
          name: isLang ? 'Past Simple & Past Continuous Tenses' : 'زمن الماضي البسيط والماضي المستمر وتطبايقاتهما',
          lessonNumber: 1,
          topic: 'Grammar',
          difficulty: 'Medium',
          estimatedStudyTime: 90,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['past simple', 'past continuous', 'when', 'while', 'as'],
          concepts: ['Narrative tenses', 'Interrupted actions in the past'],
          officialLearningOutcomes: ['Distinguish past simple and past continuous correctly', 'Use temporal conjunctions in narrative writing']
        },
        {
          id: 'eng_u1_l2',
          name: isLang ? 'Newspaper Types, Piracy & Copyrights' : 'أنواع الصحف والمجلات ومكافحة القرصنة الفكرية',
          lessonNumber: 2,
          topic: 'Vocabulary & Reading',
          difficulty: 'Easy',
          estimatedStudyTime: 75,
          estimatedRevisionTime: 25,
          relatedLessons: ['eng_u1_l1'],
          prerequisites: [],
          keywords: ['tabloid', 'broadsheet', 'piracy', 'copyright', 'casualty', 'claim'],
          concepts: ['Media literacy', 'Sensationalism vs analytical journalism'],
          officialLearningOutcomes: ['Identify differences between Tabloid and Broadsheet newspapers', 'Discuss piracy and digital rights']
        }
      ]
    },
    {
      unitNumber: 2,
      name: isLang ? 'Unit 2: Her Story & Inspirational Pioneers' : 'الوحدة الثانية: قصتها والرواد الملهمون',
      lessons: [
        {
          id: 'eng_u2_l1',
          name: isLang ? 'Present Perfect & Present Perfect Continuous' : 'زمن المضارع التام والمضارع التام المستمر',
          lessonNumber: 1,
          topic: 'Grammar',
          difficulty: 'Medium',
          estimatedStudyTime: 90,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: ['eng_u1_l1'],
          keywords: ['present perfect', 'since', 'for', 'already', 'yet', 'duration'],
          concepts: ['Unfinished actions', 'Experience vs duration'],
          officialLearningOutcomes: ['Differentiate between present perfect simple and continuous']
        },
        {
          id: 'eng_u2_l2',
          name: isLang ? 'Pioneers, Role Models & Equality' : 'الرواد، القدوة الحسنة، وتكافؤ الفرص',
          lessonNumber: 2,
          topic: 'Vocabulary & Reading',
          difficulty: 'Medium',
          estimatedStudyTime: 80,
          estimatedRevisionTime: 25,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['pioneer', 'stereotypes', 'prejudice', 'contribution', 'inspire'],
          concepts: ['Social influence', 'Overcoming barriers in science and arts'],
          officialLearningOutcomes: ['Understand key biographical texts', 'Use collocation words related to achievements']
        }
      ]
    },
    {
      unitNumber: 3,
      name: isLang ? 'Unit 3: Beyond Horizons & Smart Technology' : 'الوحدة الثالثة: ما وراء الأفق والتكنولوجيا الذكية',
      lessons: [
        {
          id: 'eng_u3_l1',
          name: isLang ? 'Future Forms (Will, Going to, Continuous, Perfect)' : 'صيغ المستقبل والتنبؤات والتخطيط',
          lessonNumber: 1,
          topic: 'Grammar',
          difficulty: 'Hard',
          estimatedStudyTime: 100,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['will', 'going to', 'future continuous', 'future perfect', 'by the time'],
          concepts: ['Future intention vs future evidence', 'Completed future actions'],
          officialLearningOutcomes: ['Apply appropriate future forms based on context and evidence']
        },
        {
          id: 'eng_u3_l2',
          name: isLang ? 'Artificial Intelligence & Space Exploration' : 'الذكاء الاصطناعي، التكنولوجيا، واستكشاف الفضاء',
          lessonNumber: 2,
          topic: 'Vocabulary & Reading',
          difficulty: 'Medium',
          estimatedStudyTime: 85,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['immersion', 'hologram', 'sensor', 'astronomy', 'artificial intelligence'],
          concepts: ['Technological ethics', 'Innovations in modern education'],
          officialLearningOutcomes: ['Read tech articles and evaluate arguments for and against AI']
        }
      ]
    },
    {
      unitNumber: 4,
      name: isLang ? 'Unit 4: Taking Care of Ourselves & Well-being' : 'الوحدة الرابعة: العناية بالذات وإدارة الضغوط',
      lessons: [
        {
          id: 'eng_u4_l1',
          name: isLang ? 'Modal Verbs of Obligation, Recommendation & Deduction' : 'أفعال الوجوب، التوصية، والاستنتاج المنطقي',
          lessonNumber: 1,
          topic: 'Grammar',
          difficulty: 'Medium',
          estimatedStudyTime: 90,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['must', 'should', 'ought to', 'must have', 'cant have'],
          concepts: ['Past deduction', 'Regret and criticism'],
          officialLearningOutcomes: ['Express obligation, prohibition and past regret accurately']
        },
        {
          id: 'eng_u4_l2',
          name: isLang ? 'Stress Management, Burnout & Productivity' : 'إدارة الضغوط النفسية، الإرهاق، والإنتاجية',
          lessonNumber: 2,
          topic: 'Vocabulary & Reading',
          difficulty: 'Medium',
          estimatedStudyTime: 80,
          estimatedRevisionTime: 25,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['burnout', 'exhaustion', 'well-being', 'time management', 'coping'],
          concepts: ['Mental health awareness', 'Work-study balance'],
          officialLearningOutcomes: ['Identify strategies for stress relief and time management']
        }
      ]
    },
    {
      unitNumber: 5,
      name: isLang ? 'Unit 5: Connections & Remote Work' : 'الوحدة الخامسة: أساليب التواصل والعمل عن بُعد',
      lessons: [
        {
          id: 'eng_u5_l1',
          name: isLang ? 'Phrasal Verbs & Infinitive vs Gerund' : 'الأفعال الاصطلاحية وأشكال مصدر الفعل (Gerund & Infinitive)',
          lessonNumber: 1,
          topic: 'Grammar',
          difficulty: 'Hard',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['phrasal verbs', 'separable', 'inseparable', 'gerund', 'infinitive'],
          concepts: ['Transitive vs intransitive phrasal verbs'],
          officialLearningOutcomes: ['Master separable and inseparable phrasal verbs in context']
        },
        {
          id: 'eng_u5_l2',
          name: isLang ? 'Virtual Meetings, Remote Work & Soft Skills' : 'الاجتماعات الافتراضية، العمل عن بُعد، والمهارات الشخصية',
          lessonNumber: 2,
          topic: 'Vocabulary & Reading',
          difficulty: 'Medium',
          estimatedStudyTime: 85,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['mute', 'unmute', 'bandwidth', 'remote work', 'collaboration'],
          concepts: ['Modern workplace dynamics', 'Digital communication etiquette'],
          officialLearningOutcomes: ['Understand remote work terminology and formal correspondence']
        }
      ]
    },
    {
      unitNumber: 6,
      name: isLang ? 'Unit 6: Great Expectations & Advanced Writing' : 'الوحدة السادسة: الرواية المقررة والتعبير الكتابي المتقدم',
      lessons: [
        {
          id: 'eng_u6_l1',
          name: isLang ? 'Great Expectations (Themes & Character Analysis)' : 'رواية التوقعات العظيمة (التحليل الأدبي والشخصيات)',
          lessonNumber: 1,
          topic: 'Literature & Novel',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['Pip', 'Estella', 'Miss Havisham', 'redemption', 'social class'],
          concepts: ['Dickensian themes', 'Moral growth and ambition'],
          officialLearningOutcomes: ['Analyze key characters and plot developments in Great Expectations']
        },
        {
          id: 'eng_u6_l2',
          name: isLang ? 'Essay Writing & Cohesive Devices' : 'كتابة المقال العربي/الإنجليزي وأدوات الربط اللغوي',
          lessonNumber: 2,
          topic: 'Writing Skills',
          difficulty: 'Medium',
          estimatedStudyTime: 95,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['thesis statement', 'topic sentence', 'cohesion', 'transitions', 'conclusion'],
          concepts: ['Argumentative essay structure', 'Cohesive devices'],
          officialLearningOutcomes: ['Draft well-structured argumentative essays with thesis statement']
        }
      ]
    }
  ];
}

function getArabicUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: 'الوحدة الأولى: قواعد الإملاء وقواعد النحو الأساسية',
      lessons: [
        {
          id: 'ara_u1_l1',
          name: 'همزة القطع وألف الوصل وقواعد كتابة الهمزة',
          lessonNumber: 1,
          topic: 'الإملاء والنطق',
          difficulty: 'Easy',
          estimatedStudyTime: 60,
          estimatedRevisionTime: 20,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['همزة قطع', 'ألف وصل', 'الهمزة المتوسطة', 'الهمزة المتطرفة'],
          concepts: ['قواعد الرسم الإملائي للهمزات'],
          officialLearningOutcomes: ['التمييز بين همزة القطع وألف الوصل في الأسماء والأفعال والحروف']
        },
        {
          id: 'ara_u1_l2',
          name: 'إعمال المشتقات (اسم الفاعل، اسم المفعول، صيغ المبالغة، اسم التفضيل)',
          lessonNumber: 2,
          topic: 'النحو والصرف',
          difficulty: 'Medium',
          estimatedStudyTime: 90,
          estimatedRevisionTime: 30,
          relatedLessons: ['ara_u1_l1'],
          prerequisites: [],
          keywords: ['اسم فاعل', 'اسم مفعول', 'صيغ مبالغة', 'اسم تفضيل', 'إعمال'],
          concepts: ['شروط إعمال المشتقات عمل فعلها'],
          officialLearningOutcomes: ['إعراب معمول المشتقات العاملة بدقة في الجمل المفيدة']
        }
      ]
    },
    {
      unitNumber: 2,
      name: 'الوحدة الثانية: الجملة الاسمية ونواسخها والمصادر',
      lessons: [
        {
          id: 'ara_u2_l1',
          name: 'أحكام المبتدأ والخبر وكان وأخواتها وإن وأخواتها وكاد وأخواتها',
          lessonNumber: 1,
          topic: 'النحو',
          difficulty: 'Hard',
          estimatedStudyTime: 100,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['مبتدأ', 'خبر', 'كان', 'إن', 'كاد', 'أفعال المقاربة والرجاء والشروع'],
          concepts: ['حالات تقديم الخبر وجوباً وجوازاً وأحكام حذف المبتدأ والخبر'],
          officialLearningOutcomes: ['تحديد نوع الخبر وإعراب جمل النواسخ التامة والناقصة']
        },
        {
          id: 'ara_u2_l2',
          name: 'المصادر (الصريحة، المؤولة، الميمية، الصناعية، اسم المرة واسم الهيئة)',
          lessonNumber: 2,
          topic: 'الصرف',
          difficulty: 'Medium',
          estimatedStudyTime: 85,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['مصدر صريح', 'مصدر مؤول', 'مصدر ميمي', 'مصدر صناعي', 'اسم مرة'],
          concepts: ['تحويل المصدر المؤول إلى صريح وإعرابه'],
          officialLearningOutcomes: ['صياغة المصادر المختلفة وإعراب الموقع الإعرابي للمصدر المؤول']
        }
      ]
    },
    {
      unitNumber: 3,
      name: 'الوحدة الثالثة: البلاغة والنقد الأدبي ومدارس الشعر الحديث',
      lessons: [
        {
          id: 'ara_u3_l1',
          name: 'التجربة الشعرية والبلاغة (الصور البيانية والمحسنات البديعية)',
          lessonNumber: 1,
          topic: 'البلاغة',
          difficulty: 'Medium',
          estimatedStudyTime: 90,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['تجربة شعرية', 'وجدان', 'فكر', 'تشبيه', 'استعارة', 'كناية', 'مجاز'],
          concepts: ['عناصر التجربة الشعرية والوحدة العضوية'],
          officialLearningOutcomes: ['استخراج الصورة المركبة والممتدة وتوضيح سر جمالها']
        },
        {
          id: 'ara_u3_l2',
          name: 'مدارس الشعر الحديث (الكلاسيكية، الديوان، أبوللو، المهاجر، الواقعية)',
          lessonNumber: 2,
          topic: 'الأدب العربي',
          difficulty: 'Hard',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 40,
          relatedLessons: ['ara_u3_l1'],
          prerequisites: [],
          keywords: ['أحمد شوقي', 'البارودي', 'العقاد', 'مطران', 'مدرسة أبوللو', 'شعر حر'],
          concepts: ['سمات المدارس الشعرية من حيث الشكل والمضمون'],
          officialLearningOutcomes: ['المقارنة بين المدارس الرومانتيكية والواقعية والكلاسيكية في الشعر']
        }
      ]
    },
    {
      unitNumber: 4,
      name: 'الوحدة الرابعة: القراءة المتحررة والقصة والأدب النثري',
      lessons: [
        {
          id: 'ara_u4_l1',
          name: 'قصة الأيام لطه حسين (تحليل السيرة الذاتية والشخصيات والأحداث)',
          lessonNumber: 1,
          topic: 'القصة والأدب',
          difficulty: 'Medium',
          estimatedStudyTime: 95,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['الأيام', 'طه حسين', 'الأزهر', 'القرية', 'سيرة ذاتية'],
          concepts: ['فن السيرة الذاتية والأسلوب الأدبي لطه حسين'],
          officialLearningOutcomes: ['تحليل البعد الإنساني والاجتماعي في قصة الأيام واستنباط المغزى القيم']
        },
        {
          id: 'ara_u4_l2',
          name: 'فن المقال والرواية والقصة القصيرة والمسرحية والقراءة المتحررة',
          lessonNumber: 2,
          topic: 'النثر الأدبي',
          difficulty: 'Medium',
          estimatedStudyTime: 85,
          estimatedRevisionTime: 25,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['مقال', 'رواية', 'قصة قصيرة', 'مسرحية', 'صراع مسرحي'],
          concepts: ['مقومات الفنون النثرية الحديثة الفنية'],
          officialLearningOutcomes: ['حل أسئلة القراءة المتحررة والنصوص النثرية وفق نواتج التعلم']
        }
      ]
    }
  ];
}

function getPhysicsUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: isLang ? 'Unit 1: Electric Current & Kirchhoff Laws' : 'الباب الأول: التيار الكهربي وقانون أوم وكيرشوف',
      lessons: [
        {
          id: 'phy_u1_l1',
          name: isLang ? 'Electric Current, Resistance & Ohm Law' : 'شدة التيار، فرق الجهد، قانون أوم، وتوصيل المقاومات',
          lessonNumber: 1,
          topic: 'Electricity',
          difficulty: 'Medium',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['current', 'resistance', 'resistivity', 'ohm law', 'series', 'parallel'],
          concepts: ['Equivalent resistance calculation', 'Resistivity and conductivity'],
          officialLearningOutcomes: ['Calculate total resistance in series and parallel circuits', 'Apply Ohm Law']
        },
        {
          id: 'phy_u1_l2',
          name: isLang ? 'Ohm Law for Closed Circuits & Kirchhoff Laws' : 'قانون أوم للدائرة المغلقة وقوانين كيرشوف الأول والثاني',
          lessonNumber: 2,
          topic: 'Circuit Analysis',
          difficulty: 'Hard',
          estimatedStudyTime: 130,
          estimatedRevisionTime: 45,
          relatedLessons: ['phy_u1_l1'],
          prerequisites: [],
          keywords: ['internal resistance', 'electromotive force', 'kirchhoff junction', 'kirchhoff loop'],
          concepts: ['Complex circuit networks', 'Conservation of charge and energy'],
          officialLearningOutcomes: ['Formulate linear equations using Kirchhoff Laws for complex meshes']
        }
      ]
    },
    {
      unitNumber: 2,
      name: isLang ? 'Unit 2: Magnetic Effect of Current & Measuring Instruments' : 'الباب الثاني: التأثير المغناطيسي للتيار وأجهزة القياس',
      lessons: [
        {
          id: 'phy_u2_l1',
          name: isLang ? 'Magnetic Field of Wires, Coils & Magnetic Force' : 'المجال المغناطيسي للسلك الملف الدائري والحلزوني والقوة',
          lessonNumber: 1,
          topic: 'Magnetism',
          difficulty: 'Medium',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: ['phy_u1_l1'],
          keywords: ['magnetic flux density', 'solenoid', 'torque', 'magnetic dipole moment'],
          concepts: ['Right hand screw rule', 'Magnetic torque on current-carrying loop'],
          officialLearningOutcomes: ['Determine direction and magnitude of magnetic flux density and force']
        },
        {
          id: 'phy_u2_l2',
          name: isLang ? 'Measuring Instruments (Galvanometer, Ammeter, Voltmeter, Ohmmeter)' : 'أجهزة القياس الكهربي (الجلفانومتر، الأميتر، الفولتميتر، الأوميتر)',
          lessonNumber: 2,
          topic: 'Electrical Instruments',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: ['phy_u2_l1'],
          prerequisites: [],
          keywords: ['moving coil galvanometer', 'shunt resistor', 'multiplier resistor', 'ohmmeter calibration'],
          concepts: ['Sensitivity modification', 'Conversion of galvanometer to ammeter/voltmeter'],
          officialLearningOutcomes: ['Calculate shunt and multiplier resistances required for specific ranges']
        }
      ]
    },
    {
      unitNumber: 3,
      name: isLang ? 'Unit 3: Electromagnetic Induction & Generators' : 'الباب الثالث: الحث الكهرومغناطيسي والدينامو والمحول',
      lessons: [
        {
          id: 'phy_u3_l1',
          name: isLang ? 'Faraday Law, Lenz Law, Mutual & Self Induction' : 'قانون فاراداي، قاعدة لينز، والحث الذاتي والمتبادل',
          lessonNumber: 1,
          topic: 'Induction',
          difficulty: 'Hard',
          estimatedStudyTime: 130,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: ['phy_u2_l1'],
          keywords: ['faraday', 'lenz law', 'induced emf', 'eddy currents', 'inductance'],
          concepts: ['Opposing magnetic fields', 'Self inductance coefficient'],
          officialLearningOutcomes: ['Apply Lenz law to identify current direction during flux changes']
        },
        {
          id: 'phy_u3_l2',
          name: isLang ? 'AC Generator (Dynamo), Transformer & Motor' : 'المولد الكهربي (الدينامو)، المحول الكهربي، والمحرك',
          lessonNumber: 2,
          topic: 'Electrical Machines',
          difficulty: 'Hard',
          estimatedStudyTime: 140,
          estimatedRevisionTime: 50,
          relatedLessons: ['phy_u3_l1'],
          prerequisites: [],
          keywords: ['dynamo', 'effective current', 'step up transformer', 'transformer efficiency'],
          concepts: ['Sinusoidal EMF waveform', 'Power transmission efficiency'],
          officialLearningOutcomes: ['Calculate instantaneous, average and effective values of AC voltage']
        }
      ]
    },
    {
      unitNumber: 4,
      name: isLang ? 'Unit 4: Alternating Current Circuits' : 'الباب الرابع: دوائر التيار المتردد والمفاعلة والرنين',
      lessons: [
        {
          id: 'phy_u4_l1',
          name: isLang ? 'Inductive & Capacitive Reactance, RLC Impedance' : 'المفاعلة الحثية والسعوية والمعاوقة الكهربية (دائرة RLC)',
          lessonNumber: 1,
          topic: 'AC Circuits',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 40,
          relatedLessons: ['phy_u3_l2'],
          prerequisites: [],
          keywords: ['reactance', 'capacitance', 'inductance', 'impedance', 'phase angle'],
          concepts: ['Phase relationship between voltage and current'],
          officialLearningOutcomes: ['Calculate total impedance and phase angle in RLC series circuits']
        },
        {
          id: 'phy_u4_l2',
          name: isLang ? 'Resonance Circuit & Oscillatory Circuit' : 'دائرة الرنين والدائرة المهتزة وتطبيقات الاستقبال',
          lessonNumber: 2,
          topic: 'Resonance',
          difficulty: 'Medium',
          estimatedStudyTime: 100,
          estimatedRevisionTime: 30,
          relatedLessons: ['phy_u4_l1'],
          prerequisites: [],
          keywords: ['resonance frequency', 'oscillatory circuit', 'tuning', 'radio receiver'],
          concepts: ['Maximum current at resonance', 'Energy exchange between capacitor and coil'],
          officialLearningOutcomes: ['Determine resonant frequency and conditions for maximum AC transmission']
        }
      ]
    },
    {
      unitNumber: 5,
      name: isLang ? 'Unit 5: Modern Physics & Quantum Theory' : 'الباب الخامس: مقدمة في الفيزياء الحديثة وازدواجية الموجة والجسيم',
      lessons: [
        {
          id: 'phy_u5_l1',
          name: isLang ? 'Black Body Radiation & Photoelectric Effect' : 'إشعاع الجسم الأسود، الظاهرة الكهرودوئية، وفوتونات بلانك',
          lessonNumber: 1,
          topic: 'Quantum Physics',
          difficulty: 'Medium',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['black body', 'planck constant', 'photoelectric effect', 'work function'],
          concepts: ['Quantum hypothesis', 'Photon energy and threshold frequency'],
          officialLearningOutcomes: ['Explain failure of classical physics and success of Einstein photoelectric equation']
        },
        {
          id: 'phy_u5_l2',
          name: isLang ? 'Compton Effect, De Broglie Wavelength & Electron Microscope' : 'ظاهرة كومتون، طول موجة دي برولي، والمجهر الإلكتروني',
          lessonNumber: 2,
          topic: 'Wave-Particle Duality',
          difficulty: 'Hard',
          estimatedStudyTime: 115,
          estimatedRevisionTime: 40,
          relatedLessons: ['phy_u5_l1'],
          prerequisites: [],
          keywords: ['compton effect', 'de broglie wavelength', 'electron microscope', 'photon momentum'],
          concepts: ['Particle nature of light and wave nature of matter'],
          officialLearningOutcomes: ['Calculate de Broglie wavelength for accelerated particles']
        }
      ]
    },
    {
      unitNumber: 6,
      name: isLang ? 'Unit 6: Lasers & Solid State Electronics' : 'الباب السادس: الليزر والإلكترونيات الحديثة والبوابات المنطقية',
      lessons: [
        {
          id: 'phy_u6_l1',
          name: isLang ? 'Laser Physics, Spontaneous & Stimulated Emission' : 'فيزياء الليزر الانبعاث التلقائي والمستحث والهولوجرام',
          lessonNumber: 1,
          topic: 'Lasers',
          difficulty: 'Medium',
          estimatedStudyTime: 95,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: ['phy_u5_l1'],
          keywords: ['laser', 'stimulated emission', 'population inversion', 'optical pumping', 'holography'],
          concepts: ['Coherence and monochromaticity of laser beam'],
          officialLearningOutcomes: ['List requirements for laser action and compare spontaneous vs stimulated emission']
        },
        {
          id: 'phy_u6_l2',
          name: isLang ? 'Semiconductors, PN Junction, Transistor & Logic Gates' : 'أشباه الموصلات النقية، الوصلة الثنائية، الترانزستور، والبوابات',
          lessonNumber: 2,
          topic: 'Electronics',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 45,
          relatedLessons: ['phy_u6_l1'],
          prerequisites: [],
          keywords: ['intrinsic semiconductor', 'doping', 'pn junction', 'transistor switch', 'AND OR NOT gates'],
          concepts: ['Binary digital logic', 'Amplifier and switch action of transistor'],
          officialLearningOutcomes: ['Construct truth tables for combined logic gate networks']
        }
      ]
    }
  ];
}

function getChemistryUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: isLang ? 'Unit 1: Transition Elements' : 'الباب الأول: العناصر الانتقالية وتفاعلات الحديد',
      lessons: [
        {
          id: 'chem_u1_l1',
          name: isLang ? 'Electronic Structure & Economic Importance of First Transition Series' : 'التركيب الإلكتروني والأهمية الاقتصادية للعناصر الانتقالية',
          lessonNumber: 1,
          topic: 'Inorganic Chemistry',
          difficulty: 'Medium',
          estimatedStudyTime: 105,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['transition elements', 'd-block', 'oxidation states', 'catalysts'],
          concepts: ['Variable oxidation states', 'Paramagnetism and color'],
          officialLearningOutcomes: ['Explain electron configurations and magnetic properties of transition metal ions']
        },
        {
          id: 'chem_u1_l2',
          name: isLang ? 'Extraction of Iron, Steel Alloys & Iron Oxides Reactions' : 'استخلاص الحديد، السبائك، وتفاعلات أكاسيد الحديد',
          lessonNumber: 2,
          topic: 'Metallurgy',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 40,
          relatedLessons: ['chem_u1_l1'],
          prerequisites: [],
          keywords: ['blast furnace', 'midrex', 'alloys', 'hematite', 'magnetite', 'iron II and III oxides'],
          concepts: ['Reduction of iron ores', 'Intermetallic vs substitutional alloys'],
          officialLearningOutcomes: ['Write balanced equations for conversions between iron and its three oxides']
        }
      ]
    },
    {
      unitNumber: 2,
      name: isLang ? 'Unit 2: Chemical Analysis' : 'الباب الثاني: التحليل الكيميائي الوصفي والكمي',
      lessons: [
        {
          id: 'chem_u2_l1',
          name: isLang ? 'Qualitative Analysis (Anions & Cations Identification)' : 'التحليل الكيميائي الوصفي (الكشف عن الأنيونات والكاتيونات)',
          lessonNumber: 1,
          topic: 'Qualitative Analysis',
          difficulty: 'Hard',
          estimatedStudyTime: 130,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['anions', 'cations', 'precipitate', 'dilute HCl group', 'barium chloride group'],
          concepts: ['Solubility rules', 'Gas evolution and confirmative tests'],
          officialLearningOutcomes: ['Identify unknown salt radicals based on systematic reagent additions']
        },
        {
          id: 'chem_u2_l2',
          name: isLang ? 'Quantitative Volumetric Analysis (Titration & Volatilization)' : 'التحليل الكيميائي الكمي (المعايرة، الترسيب، والتطاير)',
          lessonNumber: 2,
          topic: 'Quantitative Analysis',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: ['chem_u2_l1'],
          prerequisites: [],
          keywords: ['titration', 'indicator', 'neutralization', 'molarity', 'volatilization'],
          concepts: ['Stoichiometric calculations in acid-base titrations'],
          officialLearningOutcomes: ['Calculate molar concentrations and mass percentages of hydrated salts']
        }
      ]
    },
    {
      unitNumber: 3,
      name: isLang ? 'Unit 3: Chemical Equilibrium' : 'الباب الثالث: الاتزان الكيميائي والاتزان الأيوني',
      lessons: [
        {
          id: 'chem_u3_l1',
          name: isLang ? 'Reversible Reactions, Mass Action Law & Le Chatelier Principle' : 'التفاعلات الانعكاسية، قانون فعل الكتلة، وقاعدة لوشاتيليه',
          lessonNumber: 1,
          topic: 'Chemical Equilibrium',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['equilibrium constant Kc Kp', 'le chatelier', 'endothermic', 'exothermic', 'catalyst'],
          concepts: ['Factors affecting chemical equilibrium position and constant'],
          officialLearningOutcomes: ['Predict shift direction of reaction under changes of pressure, temp and conc']
        },
        {
          id: 'chem_u3_l2',
          name: isLang ? 'Ionic Equilibrium, pH, pOH & Solubility Product (Ksp)' : 'الاتزان الأيوني، الأس الهيدروجيني pH، وحاصل الإذابة Ksp',
          lessonNumber: 2,
          topic: 'Ionic Equilibrium',
          difficulty: 'Hard',
          estimatedStudyTime: 130,
          estimatedRevisionTime: 45,
          relatedLessons: ['chem_u3_l1'],
          prerequisites: [],
          keywords: ['weak electrolytes', 'ostwald law', 'pH', 'pOH', 'kw', 'ksp', 'solubility product'],
          concepts: ['Water auto-ionization', 'Ion product constant'],
          officialLearningOutcomes: ['Calculate pH of weak acids/bases and solubility product Ksp of sparingly soluble salts']
        }
      ]
    },
    {
      unitNumber: 4,
      name: isLang ? 'Unit 4: Electrochemistry' : 'الباب الرابع: الكيمياء الكهربية والتحليل الكهربي',
      lessons: [
        {
          id: 'chem_u4_l1',
          name: isLang ? 'Galvanic Cells, EMF & Standard Hydrogen Electrode' : 'الخلايا الجلفانية، قطب الهيدروجين القياسي، والسلسلة الكهرومغناطيسية',
          lessonNumber: 1,
          topic: 'Electrochemistry',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['galvanic cell', 'anode', 'cathode', 'salt bridge', 'electromotive force', 'SHE'],
          concepts: ['Spontaneous redox reactions and cell EMF calculation'],
          officialLearningOutcomes: ['Calculate standard cell potential and sequence metals in electrochemical series']
        },
        {
          id: 'chem_u4_l2',
          name: isLang ? 'Corrosion, Batteries & Faraday Laws of Electrolysis' : 'صدأ الحديد، البطاريات الفولتية، وقوانين فاراداي للتحليل الكهربي',
          lessonNumber: 2,
          topic: 'Electrolysis',
          difficulty: 'Hard',
          estimatedStudyTime: 135,
          estimatedRevisionTime: 45,
          relatedLessons: ['chem_u4_l1'],
          prerequisites: [],
          keywords: ['rusting', 'galvanization', 'lead-acid battery', 'lithium-ion battery', 'faraday first second law'],
          concepts: ['Quantitative electrolysis and electroplating'],
          officialLearningOutcomes: ['Apply Faraday laws to calculate deposited mass and electric charge']
        }
      ]
    },
    {
      unitNumber: 5,
      name: isLang ? 'Unit 5: Organic Chemistry' : 'الباب الخامس: الكيمياء العضوية ومشتقاتها',
      lessons: [
        {
          id: 'chem_u5_l1',
          name: isLang ? 'Aliphatic & Aromatic Hydrocarbons (Alkanes, Alkenes, Alkynes, Benzene)' : 'الهيدروكربونات الأليفاتية والأروماتية (الألكانات، الألكينات، الألكينات، البنزين)',
          lessonNumber: 1,
          topic: 'Organic Hydrocarbons',
          difficulty: 'Hard',
          estimatedStudyTime: 145,
          estimatedRevisionTime: 50,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['isomers', 'IUPAC naming', 'alkanes', 'markownikoff rule', 'benzene nitration'],
          concepts: ['Structural isomerism', 'Electrophilic addition and substitution'],
          officialLearningOutcomes: ['Name organic compounds using IUPAC and predict addition reaction products']
        },
        {
          id: 'chem_u5_l2',
          name: isLang ? 'Organic Derivatives (Alcohols, Phenols, Carboxylic Acids & Esters)' : 'مشتقات الهيدروكربونات (الكحوليات، الفينولات، الأحماض الكربوكسيلية، الإسترات)',
          lessonNumber: 2,
          topic: 'Organic Derivatives',
          difficulty: 'Hard',
          estimatedStudyTime: 150,
          estimatedRevisionTime: 55,
          relatedLessons: ['chem_u5_l1'],
          prerequisites: [],
          keywords: ['primary secondary tertiary alcohols', 'phenol acidity', 'esterification', 'aspirin', 'polymers'],
          concepts: ['Functional group transformations', 'Ester synthesis and hydrolysis'],
          officialLearningOutcomes: ['Outline multi-step organic reaction pathways to synthesize target molecules']
        }
      ]
    }
  ];
}

function getBiologyUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: isLang ? 'Unit 1: Support & Movement in Living Organisms' : 'الباب الأول: الدعامة والحركة في الكائنات الحية',
      lessons: [
        {
          id: 'bio_u1_l1',
          name: isLang ? 'Physiological & Structural Support in Plants & Human Skeleton' : 'الدعامة الفسيولوجية والتركيبية في النبات والهيكل العظمي في الإنسان',
          lessonNumber: 1,
          topic: 'Physiology & Anatomy',
          difficulty: 'Medium',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['turgor pressure', 'lignin', 'suberin', 'axial skeleton', 'vertebral column'],
          concepts: ['Turgor maintenance', 'Joints and ligaments mechanics'],
          officialLearningOutcomes: ['Compare physiological and structural plant support', 'Identify bones of axial skeleton']
        },
        {
          id: 'bio_u1_l2',
          name: isLang ? 'Plant Tropism & Sliding Filament Theory of Muscle Contraction' : 'الحركة في النبات والإنسان وآلية انقباض العضلة الهيكلية',
          lessonNumber: 2,
          topic: 'Muscle Physiology',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: ['bio_u1_l1'],
          prerequisites: [],
          keywords: ['sarcomere', 'actin', 'myosin', 'sliding filament theory', 'acetylcholine', 'muscle fatigue'],
          concepts: ['Neuromuscular junction', 'Sliding filament mechanism'],
          officialLearningOutcomes: ['Explain chemical and electrical changes during muscle contraction and fatigue']
        }
      ]
    },
    {
      unitNumber: 2,
      name: isLang ? 'Unit 2: Hormonal Coordination in Living Organisms' : 'الباب الثاني: التنسيق الهرموني والغدد الصماء',
      lessons: [
        {
          id: 'bio_u2_l1',
          name: isLang ? 'Pituitary, Thyroid & Parathyroid Endocrine Glands' : 'الغدة النخامية، الغدة الدرقية، والجار درقية',
          lessonNumber: 1,
          topic: 'Endocrinology',
          difficulty: 'Medium',
          estimatedStudyTime: 115,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['master gland', 'TSH', 'growth hormone', 'thyroxine', 'calcitonin', 'parathormone'],
          concepts: ['Negative feedback control', 'Calcium and metabolic regulation'],
          officialLearningOutcomes: ['Explain clinical symptoms of hypothyroidism, hyperthyroidism and acromegaly']
        },
        {
          id: 'bio_u2_l2',
          name: isLang ? 'Adrenal, Pancreatic & Sex Hormones' : 'الغدتان الكظريتان، البنكرياس، والغدد التناسلية',
          lessonNumber: 2,
          topic: 'Endocrinology',
          difficulty: 'Medium',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 35,
          relatedLessons: ['bio_u2_l1'],
          prerequisites: [],
          keywords: ['adrenaline', 'aldosterone', 'insulin', 'glucagon', 'estrogen', 'progesterone'],
          concepts: ['Blood glucose homeostasis', 'Stress response and electrolyte regulation'],
          officialLearningOutcomes: ['Analyze homeostatic mechanisms of insulin and glucagon in blood sugar regulation']
        }
      ]
    },
    {
      unitNumber: 3,
      name: isLang ? 'Unit 3: Reproduction in Living Organisms' : 'الباب الثالث: التكاثر في الكائنات الحية والحيوانات والنبات',
      lessons: [
        {
          id: 'bio_u3_l1',
          name: isLang ? 'Asexual & Sexual Reproduction & Alternation of Generations' : 'التكاثر اللاجنسي والجنسي وظاهرة تعاقب الأجيال',
          lessonNumber: 1,
          topic: 'Reproduction',
          difficulty: 'Medium',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['binary fission', 'parthenogenesis', 'plasmodium', 'metagenesis', 'spores'],
          concepts: ['Alternation of haploid and diploid generations in Malaria parasite'],
          officialLearningOutcomes: ['Compare asexual modes and evaluate evolutionary advantage of sexual reproduction']
        },
        {
          id: 'bio_u3_l2',
          name: isLang ? 'Flowering Plant Reproduction, Human Reproductive Systems & Ovarian Cycle' : 'التكاثر في النباتات الزهرية والتكاثر في الإنسان ودورة الطمث',
          lessonNumber: 2,
          topic: 'Human Reproduction',
          difficulty: 'Hard',
          estimatedStudyTime: 140,
          estimatedRevisionTime: 45,
          relatedLessons: ['bio_u3_l1'],
          prerequisites: [],
          keywords: ['double fertilization', 'spermatogenesis', 'oogenesis', 'FSH LH', 'menstrual cycle', 'IVF'],
          concepts: ['Double fertilization in angiosperms', 'Hormonal regulation of menstrual cycle'],
          officialLearningOutcomes: ['Trace stages of gametogenesis and hormonal fluctuations during menstrual cycle']
        }
      ]
    },
    {
      unitNumber: 4,
      name: isLang ? 'Unit 4: Immunity in Living Organisms' : 'الباب الرابع: المناعة في النبات والإنسان',
      lessons: [
        {
          id: 'bio_u4_l1',
          name: isLang ? 'Plant Immunity & Human Immune System Organs' : 'المناعة التركيبية والبيوكيميائية في النبات وأعضاء الجهاز المناعي في الإنسان',
          lessonNumber: 1,
          topic: 'Immunology',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['tyloses', 'canavanine', 'lymphoid organs', 'T-cells', 'B-cells', 'antibodies'],
          concepts: ['Plant defense barriers', 'Lymphoid organ function and antibody structure'],
          officialLearningOutcomes: ['Detail structural vs biochemical plant defense mechanisms']
        },
        {
          id: 'bio_u4_l2',
          name: isLang ? 'Humoral & Cell-Mediated Immune Responses' : 'آليات الجهاز المناعي (المناعة الخلطية بالترشيح والمناعة الخلوية)',
          lessonNumber: 2,
          topic: 'Immunology Mechanism',
          difficulty: 'Hard',
          estimatedStudyTime: 135,
          estimatedRevisionTime: 45,
          relatedLessons: ['bio_u4_l1'],
          prerequisites: [],
          keywords: ['macrophages', 'MHC', 'helper T cells', 'cytotoxic T cells', 'interleukins', 'perforin'],
          concepts: ['Antigen presentation', 'B-cell activation and T-cell mediated cytotoxicity'],
          officialLearningOutcomes: ['Construct flowchart of primary vs secondary immune response']
        }
      ]
    },
    {
      unitNumber: 5,
      name: isLang ? 'Unit 5: Molecular Biology (DNA & RNA)' : 'الباب الخامس: البيولوجيا الجزيئية (الحمض النووي DNA و RNA)',
      lessons: [
        {
          id: 'bio_u5_l1',
          name: isLang ? 'DNA Structure, Replication & DNA Repair Mechanisms' : 'تركيب الحمض النووي DNA وتضاعفه وآليات إصلاح عيوب DNA',
          lessonNumber: 1,
          topic: 'Molecular Genetics',
          difficulty: 'Hard',
          estimatedStudyTime: 130,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['double helix', 'nucleotides', 'DNA polymerase', 'ligase', 'repair enzymes', 'chromatin'],
          concepts: ['Semi-conservative DNA replication', 'Proofreading and DNA repair'],
          officialLearningOutcomes: ['Explain Watson-Crick model and enzymology of DNA replication']
        },
        {
          id: 'bio_u5_l2',
          name: isLang ? 'RNA Types, Protein Synthesis Code & Genetic Engineering' : 'أنواع RNA، شفرة تخليق البروتين، والهندسة الوراثية',
          lessonNumber: 2,
          topic: 'Protein Synthesis & Biotech',
          difficulty: 'Hard',
          estimatedStudyTime: 140,
          estimatedRevisionTime: 50,
          relatedLessons: ['bio_u5_l1'],
          prerequisites: [],
          keywords: ['mRNA', 'tRNA', 'rRNA', 'codon', 'ribosome', 'recombinant DNA', 'PCR'],
          concepts: ['Transcription and translation steps', 'Restriction enzymes and gene cloning'],
          officialLearningOutcomes: ['Translate mRNA sequence into amino acid chain using genetic code table']
        }
      ]
    }
  ];
}

function getPureMathUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: isLang ? 'Unit 1: Differential & Integral Calculus' : 'الباب الأول: التفاضل والتكامل وتطبيقاتهما',
      lessons: [
        {
          id: 'pure_u1_l1',
          name: isLang ? 'Derivatives of Trigonometric, Exponential & Logarithmic Functions' : 'اشتقاق الدوال المثلثية والدوال الأسية واللوغاريتمية والضمنية',
          lessonNumber: 1,
          topic: 'Differential Calculus',
          difficulty: 'Hard',
          estimatedStudyTime: 130,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['chain rule', 'implicit differentiation', 'logarithmic differentiation', 'euler number e'],
          concepts: ['Higher order derivatives', 'Transcendental function slopes'],
          officialLearningOutcomes: ['Compute first and higher derivatives for logarithmic and exponential functions']
        },
        {
          id: 'pure_u1_l2',
          name: isLang ? 'Related Time Rates & Function Behavior & Curve Sketching' : 'المعدلات الزمنية المرتبطة وسلوك الدالة ورسم المنحنيات',
          lessonNumber: 2,
          topic: 'Calculus Applications',
          difficulty: 'Hard',
          estimatedStudyTime: 135,
          estimatedRevisionTime: 45,
          relatedLessons: ['pure_u1_l1'],
          prerequisites: [],
          keywords: ['rates of change', 'critical points', 'local extrema', 'inflection points', 'concavity'],
          concepts: ['First and second derivative tests', 'Optimization problems'],
          officialLearningOutcomes: ['Solve real-world optimization and time-rate problems']
        },
        {
          id: 'pure_u1_l3',
          name: isLang ? 'Definite Integration, Areas & Volumes of Revolution' : 'التكامل المحدد وتطبيقات المساحات وحجوم الأجسام الدورانية',
          lessonNumber: 3,
          topic: 'Integral Calculus',
          difficulty: 'Hard',
          estimatedStudyTime: 140,
          estimatedRevisionTime: 50,
          relatedLessons: ['pure_u1_l1'],
          prerequisites: [],
          keywords: ['integration by substitution', 'integration by parts', 'area under curve', 'volume of revolution'],
          concepts: ['Fundamental theorem of calculus', 'Disk and washer methods'],
          officialLearningOutcomes: ['Evaluate definite integrals by parts and calculate revolution volumes around axes']
        }
      ]
    },
    {
      unitNumber: 2,
      name: isLang ? 'Unit 2: Algebra & Solid Geometry' : 'الباب الثاني: الجبر والهندسة الفراغية ثلاثية الأبعاد',
      lessons: [
        {
          id: 'pure_u2_l1',
          name: isLang ? 'Permutations, Combinations, Binomial Theorem & Complex Numbers' : 'التباديل والتوفيق ونظرية ذات الحدين والأعداد المركبة بصورها',
          lessonNumber: 1,
          topic: 'Algebra',
          difficulty: 'Hard',
          estimatedStudyTime: 140,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['permutations', 'combinations', 'binomial expansion', 'de moivre theorem', 'euler form'],
          concepts: ['Binomial general term', 'Trigonometric and exponential form of complex numbers'],
          officialLearningOutcomes: ['Apply De Moivre theorem to find roots of complex numbers']
        },
        {
          id: 'pure_u2_l2',
          name: isLang ? 'Matrices, Determinants & Systems of Linear Equations' : 'المحددات، المصفوفات، والمعكوس الضربي وحل نظم المعادلات الخطية',
          lessonNumber: 2,
          topic: 'Linear Algebra',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 40,
          relatedLessons: ['pure_u2_l1'],
          prerequisites: [],
          keywords: ['determinants', 'matrix inverse', 'cramer rule', 'rank of matrix', 'augmented matrix'],
          concepts: ['Matrix rank and consistency of linear systems'],
          officialLearningOutcomes: ['Solve 3x3 systems of linear equations using multiplicative inverse matrix']
        },
        {
          id: 'pure_u2_l3',
          name: isLang ? '3D Coordinates, Vector Products, Lines & Planes in Space' : 'الهندسة الفراغية ثلاثية الأبعاد، الضرب القياسي والاتجاهي، والكرة',
          lessonNumber: 3,
          topic: 'Solid Geometry',
          difficulty: 'Hard',
          estimatedStudyTime: 135,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['3D coordinates', 'sphere equation', 'dot product', 'cross product', 'plane equation in space'],
          concepts: ['Direction cosines', 'Distance from point to plane'],
          officialLearningOutcomes: ['Derive vector and Cartesian equations of lines and planes in space']
        }
      ]
    }
  ];
}

function getAppliedMathUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: isLang ? 'Unit 1: Statics & Equilibrium' : 'الباب الأول: الاستاتيكا والاتزان العام والاحتكاك',
      lessons: [
        {
          id: 'app_u1_l1',
          name: isLang ? 'Friction on Rough Horizontal & Inclined Planes & Moments' : 'الاحتكاك على المستويات الأفقية والمائلة والعزوم في 2D و 3D',
          lessonNumber: 1,
          topic: 'Statics Friction & Moments',
          difficulty: 'Hard',
          estimatedStudyTime: 130,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['coefficient of friction', 'limiting friction', 'angle of friction', 'moment vector', 'varignon theorem'],
          concepts: ['Limiting static equilibrium', 'Moment about a point in space'],
          officialLearningOutcomes: ['Calculate force required to initiate motion on rough inclined plane']
        },
        {
          id: 'app_u1_l2',
          name: isLang ? 'Parallel Forces, General Equilibrium, Couples & Center of Gravity' : 'القوى المتوازية، الاتزان العام، الازدواجات، ومركز الثقل',
          lessonNumber: 2,
          topic: 'General Statics Equilibrium',
          difficulty: 'Hard',
          estimatedStudyTime: 140,
          estimatedRevisionTime: 50,
          relatedLessons: ['app_u1_l1'],
          prerequisites: [],
          keywords: ['resultant of parallel forces', 'ladder equilibrium', 'couples', 'center of mass', 'negative mass method'],
          concepts: ['Conditions for general rigid body equilibrium', 'Couples equivalence'],
          officialLearningOutcomes: ['Determine reaction forces at hinges and smooth supports for loaded rods']
        }
      ]
    },
    {
      unitNumber: 2,
      name: isLang ? 'Unit 2: Dynamics & Laws of Motion' : 'الباب الثاني: الديناميكا وقوانين الحركة والطاقة',
      lessons: [
        {
          id: 'app_u2_l1',
          name: isLang ? 'Straight Line Motion & Newton Three Laws of Motion' : 'الحركة في خط مستقيم وتفاضل وتكامل الدوال المتجهة وقوانين نيوتن الثلاثة',
          lessonNumber: 1,
          topic: 'Kinematics & Dynamics',
          difficulty: 'Hard',
          estimatedStudyTime: 135,
          estimatedRevisionTime: 45,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['displacement', 'velocity', 'acceleration', 'newton first law', 'newton second law', 'apparent weight'],
          concepts: ['Vector calculus motion', 'Elevator motion and apparent weight'],
          officialLearningOutcomes: ['Solve motion equations for interconnected masses over smooth and rough pulleys']
        },
        {
          id: 'app_u2_l2',
          name: isLang ? 'Work, Power, Kinetic & Potential Energy, Impulse & Collision' : 'الشغل، القدرة، طاقة الحركة، طاقة الوضع، الدفع والتصادم',
          lessonNumber: 2,
          topic: 'Energy & Momentum',
          difficulty: 'Hard',
          estimatedStudyTime: 140,
          estimatedRevisionTime: 50,
          relatedLessons: ['app_u2_l1'],
          prerequisites: [],
          keywords: ['work', 'power', 'kinetic energy', 'potential energy', 'work energy principle', 'impulse', 'collision'],
          concepts: ['Conservation of mechanical energy', 'Impulsive forces and elastic/inelastic collisions'],
          officialLearningOutcomes: ['Apply work-energy principle to compute velocities of moving bodies']
        }
      ]
    }
  ];
}

function getHistoryUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: 'الباب الأول: الحملة الفرنسية على مصر والشام (1798 - 1801م)',
      lessons: [
        {
          id: 'hist_u1_l1',
          name: 'المجتمع المصري قبيل الحملة الفرنسية ونزول قوات نابليون بونابرت',
          lessonNumber: 1,
          topic: 'تاريخ مصر الحديث',
          difficulty: 'Medium',
          estimatedStudyTime: 95,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['الحملة الفرنسية', 'نابليون', 'المماليك', 'الدولة العثمانية', 'معركة إمبابة'],
          concepts: ['أحوال مصر الاقتصادية والاجتماعية تحت الحكم العثماني قبيل الحملة'],
          officialLearningOutcomes: ['تحليل أسباب الحملة الفرنسية وتقييم حالة الدولة المصرية في القرن الـ18']
        },
        {
          id: 'hist_u1_l2',
          name: 'مقاومة الشعب المصري وجلاء الحملة والآثار السياسية والعلمية',
          lessonNumber: 2,
          topic: 'المقاومة والآثار',
          difficulty: 'Medium',
          estimatedStudyTime: 100,
          estimatedRevisionTime: 30,
          relatedLessons: ['hist_u1_l1'],
          prerequisites: [],
          keywords: ['ثورة القاهرة الأولى', 'كليبر', 'مينو', 'المجمع العلمي', 'حجر رشيد'],
          concepts: ['الآثار العلمية والسياسية للحملة الفرنسية واكتشاف التاريخ المصري القديم'],
          officialLearningOutcomes: ['استنتاج دور المجمع العلمي وفك رموز حجر رشيد في التنوير الحديث']
        }
      ]
    },
    {
      unitNumber: 2,
      name: 'الباب الثاني: بناء الدولة الحديثة في مصر (عصر محمد علي وخلفائه)',
      lessons: [
        {
          id: 'hist_u2_l1',
          name: 'صعود محمد علي للحكم وتثبيت سلطته ونظام الاحتكار الاقتصادي',
          lessonNumber: 1,
          topic: 'بناء الدولة',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: ['hist_u1_l2'],
          keywords: ['محمد علي', 'الزعامات الشعبية', 'عمر مكرم', 'مذبحة القلعة', 'الاحتكار'],
          concepts: ['تطبيق نظام الاحتكار في الزراعة والصناعة والتجارة ودوره في النهضة'],
          officialLearningOutcomes: ['توضيح سياسة محمد علي في التخلص من المنافسين وتحديث الاقتصاد']
        },
        {
          id: 'hist_u2_l2',
          name: 'التوسع العسكري والحروب الخارجية والصدام مع الدول الأوربية (معاهدة لندن 1840)',
          lessonNumber: 2,
          topic: 'السياسة الخارجية',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 40,
          relatedLessons: ['hist_u2_l1'],
          prerequisites: [],
          keywords: ['حرب الشام', 'حرب اليونان', 'معاهدة لندن 1840', 'فرمانا 1841'],
          concepts: ['تكوين الرابطة العربية ومواجهة الدول الأوربية لحفظ التوازن الدولي'],
          officialLearningOutcomes: ['تحليل شروط معاهدة لندن 1840 وتأثيرها على السيادة المصرية']
        }
      ]
    },
    {
      unitNumber: 3,
      name: 'الباب الثالث: مصر منذ الثورة العرابية حتى الاحتلال البريطاني',
      lessons: [
        {
          id: 'hist_u3_l1',
          name: 'الأزمة المالية والثورة العرابية والاحتلال البريطاني لمصر 1882م',
          lessonNumber: 1,
          topic: 'الثورة العرابية',
          difficulty: 'Hard',
          estimatedStudyTime: 115,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['الخديوي توفيق', 'أحمد عرابي', 'مظاهرة عابدين', 'الاحتلال البريطاني', 'التل الكبير'],
          concepts: ['أسباب التدخل الأجنبي وظروف اندلاع الثورة العرابية ومراحل الاحتلال'],
          officialLearningOutcomes: ['تحديد أسباب فشل الثورة العرابية رغم عدالة مطالب الشعب']
        },
        {
          id: 'hist_u3_l2',
          name: 'الحركة الوطنية وضياع الاستقلال ومرحلة مصطفى كامل ومحمد فريد',
          lessonNumber: 2,
          topic: 'الحركة الوطنية',
          difficulty: 'Medium',
          estimatedStudyTime: 105,
          estimatedRevisionTime: 30,
          relatedLessons: ['hist_u3_l1'],
          prerequisites: [],
          keywords: ['مصطفى كامل', 'حادثة دنشواي', 'محمد فريد', 'الجريدة', 'الحزب الوطني'],
          concepts: ['كفاح الحزب الوطني لإيقاظ الوعي القومي وتنديد بالاحتلال البريطاني'],
          officialLearningOutcomes: ['تقييم أساليب النضال الوطني لمصطفى كامل عقب حادثة دنشواي 1906']
        }
      ]
    },
    {
      unitNumber: 4,
      name: 'الباب الرابع: ثورة 1919 وتطور مصر المعاصر حتى ثورة 23 يوليو 1952',
      lessons: [
        {
          id: 'hist_u4_l1',
          name: 'ثورة 1919 وسعد زغلول وتصريح 28 فبراير ومعاهدة 1936',
          lessonNumber: 1,
          topic: 'ثورة 1919',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['سعد زغلول', 'ثورة 1919', 'الوفد المصري', 'تصريح 28 فبراير', 'معاهدة 1936'],
          concepts: ['الوحدة الوطنية بين المسلمين والأقباط والمطالبة بالاستقلال التام'],
          officialLearningOutcomes: ['شرح التحول التاريخي من الفكرة العثمانية إلى القومية المصرية الخالصة']
        },
        {
          id: 'hist_u4_l2',
          name: 'ثورة 23 يوليو 1952م وإنجازاتها السياسية والاقتصادية والعربية',
          lessonNumber: 2,
          topic: 'ثورة يوليو',
          difficulty: 'Medium',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 35,
          relatedLessons: ['hist_u4_l1'],
          prerequisites: [],
          keywords: ['الضباط الأحرار', 'جمال عبد الناصر', 'إلغاء الملكية', 'تأميم السويس', 'السد العالي'],
          concepts: ['إنجازات ثورة يوليو في القضاء على الإقطاع والاستعمار ودعم حركات التحرر'],
          officialLearningOutcomes: ['تحليل المبادئ الستة لثورة يوليو ومدى تحققها في المجتمع المصري']
        }
      ]
    }
  ];
}

function getGeographyUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: 'الباب الأول: مدخل لدراسة الجغرافيا السياسية والدولة',
      lessons: [
        {
          id: 'geo_u1_l1',
          name: 'مفهوم الجغرافيا السياسية، أهدافها، وتقنيات الجغرافيا الحديثة',
          lessonNumber: 1,
          topic: 'مدخل الجغرافيا السياسية',
          difficulty: 'Medium',
          estimatedStudyTime: 95,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['جغرافيا سياسية', 'جيوبوليتيك', 'راتزل', 'أرسطو', 'استشعار عن بعد', 'GIS'],
          concepts: ['الفرق بين الجغرافيا السياسية والجيوبوليتيك ودور تقنيات الاستشعار'],
          officialLearningOutcomes: ['التمييز بين النظرة الاستاتيكية والديناميكية لخريطة العالم السياسية']
        },
        {
          id: 'geo_u1_l2',
          name: 'الدولة ومقوماتها الطبيعية والبشرية (المساحة، الموقع، والسكان)',
          lessonNumber: 2,
          topic: 'مقومات الدولة',
          difficulty: 'Hard',
          estimatedStudyTime: 115,
          estimatedRevisionTime: 40,
          relatedLessons: ['geo_u1_l1'],
          prerequisites: [],
          keywords: ['دولة وحدوية', 'دولة فيدرالية', 'شكل الدولة', 'العاصمة', 'المقومات البشرية'],
          concepts: ['تأثير الموقع الفلكي والشكل والتضاريس على قوة الدولة السياسية والعسكرية'],
          officialLearningOutcomes: ['تحليل خريطة العالم السياسية وتحديد أنواع الدول وفق نظامها الإداري']
        }
      ]
    },
    {
      unitNumber: 2,
      name: 'الباب الثاني: الحدود السياسية والمشكلات الدولية',
      lessons: [
        {
          id: 'geo_u2_l1',
          name: 'أنواع الحدود السياسية (المائية والجبلية والهندسية) ووظائفها',
          lessonNumber: 1,
          topic: 'الحدود السياسية',
          difficulty: 'Hard',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 35,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['حدود طبيعية', 'حدود هندسية', 'حدود جبلية', 'حدود نهرية', 'الرصيف القاري'],
          concepts: ['وظائف الحد السياسي (الحماية، الأمن، وتحديد السيادة الاقتصادية)'],
          officialLearningOutcomes: ['المقارنة بين رسم الحدود في الأنهار والجبال والمياه الإقليمية']
        },
        {
          id: 'geo_u2_l2',
          name: 'المشكلات السياسية الدولية (سبتة ومليلة، كشمير، حركة الرعاة)',
          lessonNumber: 2,
          topic: 'المشكلات الدولية',
          difficulty: 'Medium',
          estimatedStudyTime: 105,
          estimatedRevisionTime: 30,
          relatedLessons: ['geo_u2_l1'],
          prerequisites: [],
          keywords: ['مشكلات حدودية', 'سبتة ومليلة', 'كشمير', 'نزاعات الرعاة', 'طابا'],
          concepts: ['دور المنظمات الدولية والمحاكم في حل النزاعات الحدودية سلمياً'],
          officialLearningOutcomes: ['شرح قضية طابا ودور التحكيم الدولي في إثبات الحقوق المصرية']
        }
      ]
    },
    {
      unitNumber: 3,
      name: 'الباب الثالث: التكتلات الاقتصادية والأحلاف العسكرية والنظام العالمي',
      lessons: [
        {
          id: 'geo_u3_l1',
          name: 'التكتلات الاقتصادية العالمية (الاتحاد الأوروبي، الكوميسا، الأوبك)',
          lessonNumber: 1,
          topic: 'التكتلات الاقتصادية',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['تكتل اقتصادي', 'اتحاد جمركي', 'سوق مشتركة', 'الاتحاد الأوروبي', 'الكوميسا'],
          concepts: ['مراحل قيام التكتل الاقتصادي ومقومات نجاحه الجغرافية والبشرية'],
          officialLearningOutcomes: ['تتبع مراحل اندماج الاقتصاديات في الاتحاد الأوروبي ودور الكوميسا']
        },
        {
          id: 'geo_u3_l2',
          name: 'الأحلاف العسكرية والنظام العالمي الجديد والعولمة',
          lessonNumber: 2,
          topic: 'النظام العالمي',
          difficulty: 'Medium',
          estimatedStudyTime: 110,
          estimatedRevisionTime: 35,
          relatedLessons: ['geo_u3_l1'],
          prerequisites: [],
          keywords: ['حلف الناتو', 'حلف ورسو', 'النظام العالمي الجديد', 'العولمة الاقتصادية'],
          concepts: ['ظاهرة الثورة المعلوماتية والهيمنة الأمريكية عقب تفكك الاتحاد السوفيتي'],
          officialLearningOutcomes: ['تقييم أهداف النظام العالمي الجديد وتأثيراته على الدول النامية']
        }
      ]
    }
  ];
}

function getPhilosophyUnits(isLang: boolean): Unit[] {
  return [
    {
      unitNumber: 1,
      name: 'الباب الأول: الفلسفة التطبيقية (البيئة، الأخلاق البيولوجية، وأخلاقيات المهنة)',
      lessons: [
        {
          id: 'phil_u1_l1',
          name: 'مفهوم الفلسفة البيئية ومراحل علاقة الإنسان بالبيئة عبر العصور',
          lessonNumber: 1,
          topic: 'فلسفة البيئة',
          difficulty: 'Medium',
          estimatedStudyTime: 100,
          estimatedRevisionTime: 30,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['فلسفة بيئية', 'مرحلة التقديس', 'مرحلة الاستغلال', 'مرحلة القهر', 'مرحلة الاحترام'],
          concepts: ['تطور نظرة الإنسان الطبيعية نحو البيئة وحقوق الأجيال القادمة'],
          officialLearningOutcomes: ['تحليل أفكار لاوتسي وهانز يوناس وبيتر سنجر في حماية حقوق الكائنات']
        },
        {
          id: 'phil_u1_l2',
          name: 'الأخلاق البيولوجية والطبية (البيوتيقا) وأخلاقيات البحث العلمي والمهنة',
          lessonNumber: 2,
          topic: 'البيوتيقا وأخلاقيات المهنة',
          difficulty: 'Hard',
          estimatedStudyTime: 115,
          estimatedRevisionTime: 35,
          relatedLessons: ['phil_u1_l1'],
          prerequisites: [],
          keywords: ['بيوتيقا', 'استزراع الأعضاء', 'الموت الرحيم', 'الجينوم البشري', 'الموافي المستنيرة'],
          concepts: ['المعضلات الأخلاقية الناتجة عن التطور الطبي والهندسة الوراثية'],
          officialLearningOutcomes: ['تحديد عناصر الموافقة المستنيرة وتوضيح أبعاد الأخلاق المهنية']
        }
      ]
    },
    {
      unitNumber: 2,
      name: 'الباب الثاني: المنطق الاستقرائي والتفكير العلمي والذكاء الاصطناعي',
      lessons: [
        {
          id: 'phil_u2_l1',
          name: 'الاستدلال الاستقرائي وتطبيقاته في العلوم الطبيعية والمنهج العلمي',
          lessonNumber: 1,
          topic: 'المنطق الاستقرائي',
          difficulty: 'Hard',
          estimatedStudyTime: 120,
          estimatedRevisionTime: 40,
          relatedLessons: [],
          prerequisites: [],
          keywords: ['استقراء تام', 'استقراء ناقص', 'فرانسيس بيكون', 'طرق جون ستيوارت مل'],
          concepts: ['خطوات المنهج الاستقرائي التجريبي (الملاحظة، التجربة، والفرض العلمي)'],
          officialLearningOutcomes: ['التطبيق العملي لطرق مل الخمس في اكتشاف الأسباب والعلل']
        },
        {
          id: 'phil_u2_l2',
          name: 'المنهج الاستنباطي، الصياغة الرمزية، والدوال المنطقية في الذكاء الاصطناعي',
          lessonNumber: 2,
          topic: 'المنطق والذكاء الاصطناعي',
          difficulty: 'Hard',
          estimatedStudyTime: 125,
          estimatedRevisionTime: 40,
          relatedLessons: ['phil_u2_l1'],
          prerequisites: [],
          keywords: ['نسق استنباطي', 'صياغة رمزية', 'دالة العطف', 'دالة الفصل', 'الذكاء الاصطناعي'],
          concepts: ['علاقة المنطق الصوري والغير رتيب بتطوير الخوارزميات والبرمجيات الذكية'],
          officialLearningOutcomes: ['صياغة الحجج المنطقية بالرموز وتحديد قيم الصدق للدوال المنطقية']
        }
      ]
    }
  ];
}

// ==========================================
// MAIN GENERATOR FUNCTION
// ==========================================

export function generateSubjectsFor(
  academicYear: 'first' | 'second' | 'third',
  curriculumTrack: 'arabic' | 'languages',
  specialization: 'science' | 'math' | 'literature' | 'general'
): CurriculumSubject[] {
  const isLang = curriculumTrack === 'languages';
  
  if (specialization === 'math') {
    // Math Track: Strictly NO History, NO Geography, NO Philosophy!
    return [
      { 
        id: `${academicYear}_${curriculumTrack}_math_arabic`, 
        name: isLang ? 'Arabic Language (اللغة العربية)' : 'اللغة العربية', 
        academicYear,
        curriculumTrack,
        specialization: 'math',
        color: '#FF5733', 
        icon: 'BookOpen', 
        maxScore: 80, 
        units: getArabicUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_math_english`, 
        name: isLang ? 'English (First Foreign Language)' : 'اللغة الإنجليزية الأولى', 
        academicYear,
        curriculumTrack,
        specialization: 'math',
        color: '#33FF57', 
        icon: 'Languages', 
        maxScore: 60, 
        units: getEnglishUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_math_pure`, 
        name: isLang ? 'Pure Mathematics (الرياضيات البحتة)' : 'الرياضيات البحتة (تفاضل وتكامل وجبر)', 
        academicYear,
        curriculumTrack,
        specialization: 'math',
        color: '#3357FF', 
        icon: 'Layers', 
        maxScore: 30, 
        units: getPureMathUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_math_applied`, 
        name: isLang ? 'Applied Mathematics (الرياضيات التطبيقية)' : 'الرياضيات التطبيقية (استاتيكا وديناميكا)', 
        academicYear,
        curriculumTrack,
        specialization: 'math',
        color: '#3b82f6', 
        icon: 'Compass', 
        maxScore: 30, 
        units: getAppliedMathUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_math_physics`, 
        name: isLang ? 'Physics (الفيزياء)' : 'الفيزياء', 
        academicYear,
        curriculumTrack,
        specialization: 'math',
        color: '#F3FF33', 
        icon: 'Flame', 
        maxScore: 60, 
        units: getPhysicsUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_math_chemistry`, 
        name: isLang ? 'Chemistry (الكيمياء)' : 'الكيمياء', 
        academicYear,
        curriculumTrack,
        specialization: 'math',
        color: '#FF33F3', 
        icon: 'FlaskConical', 
        maxScore: 60, 
        units: getChemistryUnits(isLang)
      }
    ];
  } else if (specialization === 'science') {
    // Science Track: Strictly NO History, NO Geography, NO Philosophy!
    return [
      { 
        id: `${academicYear}_${curriculumTrack}_science_arabic`, 
        name: isLang ? 'Arabic Language (اللغة العربية)' : 'اللغة العربية', 
        academicYear,
        curriculumTrack,
        specialization: 'science',
        color: '#FF5733', 
        icon: 'BookOpen', 
        maxScore: 80, 
        units: getArabicUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_science_english`, 
        name: isLang ? 'English (First Foreign Language)' : 'اللغة الإنجليزية الأولى', 
        academicYear,
        curriculumTrack,
        specialization: 'science',
        color: '#33FF57', 
        icon: 'Languages', 
        maxScore: 60, 
        units: getEnglishUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_science_biology`, 
        name: isLang ? 'Biology (الأحياء)' : 'الأحياء', 
        academicYear,
        curriculumTrack,
        specialization: 'science',
        color: '#3357FF', 
        icon: 'Layers', 
        maxScore: 60, 
        units: getBiologyUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_science_physics`, 
        name: isLang ? 'Physics (الفيزياء)' : 'الفيزياء', 
        academicYear,
        curriculumTrack,
        specialization: 'science',
        color: '#F3FF33', 
        icon: 'Flame', 
        maxScore: 60, 
        units: getPhysicsUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_science_chemistry`, 
        name: isLang ? 'Chemistry (الكيمياء)' : 'الكيمياء', 
        academicYear,
        curriculumTrack,
        specialization: 'science',
        color: '#FF33F3', 
        icon: 'FlaskConical', 
        maxScore: 60, 
        units: getChemistryUnits(isLang)
      }
    ];
  } else if (specialization === 'literature') {
    // Literature Track: Arabic, English, History, Geography, Philosophy & Logic
    return [
      { 
        id: `${academicYear}_${curriculumTrack}_lit_arabic`, 
        name: isLang ? 'Arabic Language (اللغة العربية)' : 'اللغة العربية', 
        academicYear,
        curriculumTrack,
        specialization: 'literature',
        color: '#FF5733', 
        icon: 'BookOpen', 
        maxScore: 80, 
        units: getArabicUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_lit_english`, 
        name: isLang ? 'English (First Foreign Language)' : 'اللغة الإنجليزية الأولى', 
        academicYear,
        curriculumTrack,
        specialization: 'literature',
        color: '#33FF57', 
        icon: 'Languages', 
        maxScore: 60, 
        units: getEnglishUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_lit_history`, 
        name: isLang ? 'History (التاريخ)' : 'التاريخ', 
        academicYear,
        curriculumTrack,
        specialization: 'literature',
        color: '#3357FF', 
        icon: 'Layers', 
        maxScore: 60, 
        units: getHistoryUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_lit_geography`, 
        name: isLang ? 'Geography (الجغرافيا)' : 'الجغرافيا السياسية', 
        academicYear,
        curriculumTrack,
        specialization: 'literature',
        color: '#F3FF33', 
        icon: 'Flame', 
        maxScore: 60, 
        units: getGeographyUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_lit_philosophy`, 
        name: isLang ? 'Philosophy & Logic (الفلسفة والمنطق)' : 'الفلسفة والمنطق', 
        academicYear,
        curriculumTrack,
        specialization: 'literature',
        color: '#9B51E0', 
        icon: 'Brain', 
        maxScore: 60, 
        units: getPhilosophyUnits(isLang)
      }
    ];
  } else {
    // Default core common subjects (Arabic, English)
    return [
      { 
        id: `${academicYear}_${curriculumTrack}_gen_arabic`, 
        name: isLang ? 'Arabic Language (اللغة العربية)' : 'اللغة العربية', 
        academicYear,
        curriculumTrack,
        specialization: 'general',
        color: '#FF5733', 
        icon: 'BookOpen', 
        maxScore: 80, 
        units: getArabicUnits(isLang)
      },
      { 
        id: `${academicYear}_${curriculumTrack}_gen_english`, 
        name: isLang ? 'English (First Foreign Language)' : 'اللغة الإنجليزية الأولى', 
        academicYear,
        curriculumTrack,
        specialization: 'general',
        color: '#33FF57', 
        icon: 'Languages', 
        maxScore: 60, 
        units: getEnglishUnits(isLang)
      }
    ];
  }
}

// Generate the fully expanded SEED_SUBJECTS array
function buildAllSeedSubjects(): CurriculumSubject[] {
  const years: ('first' | 'second' | 'third')[] = ['first', 'second', 'third'];
  const tracks: ('arabic' | 'languages')[] = ['arabic', 'languages'];
  const streams: ('science' | 'math' | 'literature' | 'general')[] = ['science', 'math', 'literature', 'general'];
  
  const results: CurriculumSubject[] = [];
  for (const y of years) {
    for (const t of tracks) {
      for (const s of streams) {
        results.push(...generateSubjectsFor(y, t, s));
      }
    }
  }
  return results;
}

export const SEED_SUBJECTS: CurriculumSubject[] = buildAllSeedSubjects();
