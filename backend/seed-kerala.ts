import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Wiping all existing data ---');

  // Delete in order to satisfy foreign key constraints
  await prisma.modAudit.deleteMany();
  await prisma.postSupport.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postAttachment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.expert.deleteMany();
  await prisma.partnerBridge.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.analysisResult.deleteMany();
  await prisma.analysisRequest.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.sleepLog.deleteMany();
  await prisma.moodLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.faceVerification.deleteMany();
  await prisma.redFlagLog.deleteMany();
  await prisma.redButtonEvent.deleteMany();
  await prisma.taskTracker.deleteMany();
  await prisma.resourceHub.deleteMany();
  await prisma.user.deleteMany();
  await prisma.removedExpert.deleteMany();

  console.log('--- Database Cleared ---');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  console.log('--- Seeding Kerala-based Data ---');

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      fullName: 'MamaSafe Admin Kerala',
      email: 'admin@mamasafe.in',
      passwordHash: passwordHash,
      role: 'admin',
    },
  });

  // 2. Experts across Kerala
  const expertsData = [
    {
      name: 'Dr. Kavitha Nair',
      email: 'kavitha.nair@skhospital.com',
      specialization: 'Obstetrics & Gynecology',
      location: 'Trivandrum',
      license: 'KMC-2024-998',
      bio: 'Leading expert in maternal mental health at S.K. Hospital, Trivandrum.',
      avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: 'Dr. Saji Varghese',
      email: 'saji.v@astermedcity.com',
      specialization: 'Perinatal Psychiatrist',
      location: 'Kochi',
      license: 'KMC-2024-442',
      bio: 'Specialist in postpartum mood disorders at Aster Medcity, Kochi.',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: 'Dr. Meera Nambiar',
      email: 'meera.nambiar@bmh.com',
      specialization: 'Pediatrician',
      location: 'Kozhikode',
      license: 'KMC-2024-115',
      bio: 'Expert in newborn care and maternal bonding, Baby Memorial Hospital.',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ef15995d?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: 'Dr. Aisha Rahman',
      email: 'aisha.r@keralaclinic.com',
      specialization: 'Lactation Consultant',
      location: 'Malappuram',
      license: 'KMC-PENDING-789',
      bio: 'New expert awaiting platform verification.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      isVerified: false
    }
  ];

  for (const ex of expertsData) {
    const user = await prisma.user.create({
      data: {
        fullName: ex.name,
        email: ex.email,
        passwordHash: passwordHash,
        role: 'professional',
        phoneNumber: '+9100000000',
        communityBio: `${ex.specialization}, ${ex.location}.`,
        avatarUrl: ex.avatar
      },
    });

    await prisma.expert.create({
      data: {
        userId: user.userId,
        specialization: ex.specialization,
        licenseNo: ex.license,
        bio: ex.bio,
        isVerified: ex.isVerified === false ? false : true,
        availability: 'Mon-Sat: 9:00 AM - 5:00 PM',
      },
    });

    // Add Face Verification
    await prisma.faceVerification.create({
      data: {
        userId: user.userId,
        verificationStatus: 'verified',
        verifiedAt: new Date()
      }
    });
  }

  // 2.5 Removed/Archived Experts
  await prisma.removedExpert.createMany({
    data: [
      {
        fullName: 'Dr. Jacob Mathew',
        email: 'jacob.m@oldhealth.com',
        specialization: 'General Practitioner',
        licenseNo: 'KMC-1980-001',
        removedAt: new Date(Date.now() - 86400000 * 15) // 15 days ago
      },
      {
        fullName: 'Dr. Priya Raj',
        email: 'priya.r@maternalcare.com',
        specialization: 'Obstetrics',
        licenseNo: 'KMC-1995-101',
        removedAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
      }
    ]
  });

  // 3. Mothers & Partners (Pairs with Bridges)
  const pairs = [
    {
      mother: { name: 'Gauri Menon', email: 'gauri@gmail.com', location: 'Kochi', pseudonym: 'KochiMomma' },
      partner: { name: 'Arjun Menon', email: 'arjun@gmail.com' }
    },
    {
      mother: { name: 'Anjali Das', email: 'anjali@gmail.com', location: 'Trivandrum', pseudonym: 'TVM_Mother' },
      partner: { name: 'Rahul Das', email: 'rahul@gmail.com' }
    },
    {
      mother: { name: 'Fathima Sahla', email: 'fathima@gmail.com', location: 'Kozhikode', pseudonym: 'MalabarQueen' },
      partner: { name: 'Imran Khan', email: 'imran@gmail.com' }
    }
  ];

  for (const pair of pairs) {
    const mUser = await prisma.user.create({
      data: {
        fullName: pair.mother.name,
        email: pair.mother.email,
        passwordHash: passwordHash,
        role: 'mother',
        communityPseudonym: pair.mother.pseudonym,
        communityBio: `Expecting mom from ${pair.mother.location}.`,
      },
    });

    await prisma.profile.create({
      data: {
        userId: mUser.userId,
        firstPregnancy: true,
        historyOfBipolar: false,
        babyBirthDate: new Date('2026-09-10'),
      },
    });

    const pUser = await prisma.user.create({
      data: {
        fullName: pair.partner.name,
        email: pair.partner.email,
        passwordHash: passwordHash,
        role: 'partner',
      },
    });

    await prisma.partnerBridge.create({
      data: {
        motherUserId: mUser.userId,
        partnerUserId: pUser.userId,
        partnerEmail: pUser.email,
        accessLevel: 'FullAccess',
        alertNotification: true,
      },
    });

    // Generate 5 past days of health data
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (4 - i));

      await prisma.moodLog.create({
        data: {
          userId: mUser.userId,
          moodScore: Math.floor(Math.random() * 4) + 5, // 5 to 8
          notes: `Feeling okay, day ${i + 1}`,
          createdAt: date
        }
      });

      await prisma.sleepLog.create({
        data: {
          userId: mUser.userId,
          hoursSlept: Math.floor(Math.random() * 3) + 5, // 5 to 7
          sleepQuality: Math.floor(Math.random() * 5) + 5,
          createdAt: date
        }
      });
    }

    // Add tasks for the partner
    await prisma.taskTracker.createMany({
      data: [
        { userId: pUser.userId, title: 'Buy prenatal vitamins', isComplete: true, createdAt: new Date(Date.now() - 86400000 * 2) },
        { userId: pUser.userId, title: 'Set up the nursery space', isComplete: false },
        { userId: pUser.userId, title: 'Accompany mom to Dr. appointment', isComplete: false }
      ]
    });

    // Add alerts visible to partner
    await prisma.alert.create({
      data: {
        userId: mUser.userId,
        riskLevel: 'warning',
        message: 'Sleep has been consistently low for the past few days. Partner notified.',
        resolved: false,
        createdAt: new Date()
      }
    });

    // FaceVerification for Mother & Partner
    await prisma.faceVerification.create({
      data: {
        userId: mUser.userId,
        verificationStatus: 'verified',
        verifiedAt: new Date()
      }
    });

    await prisma.faceVerification.create({
      data: {
        userId: pUser.userId,
        verificationStatus: Math.random() > 0.8 ? 'pending' : 'verified',
        verifiedAt: new Date()
      }
    });

    // System Analytics: Red Flags & Red Button Events
    await prisma.redFlagLog.create({
      data: {
        userId: mUser.userId,
        triggerSource: Math.random() > 0.5 ? 'Sleep' : 'Journal',
        severity: Math.random() > 0.7 ? 'Critical' : 'High',
        createdAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 5))
      }
    });

    // Occasional resolved emergency
    if (Math.random() > 0.5) {
      await prisma.redButtonEvent.create({
        data: {
          userId: mUser.userId,
          emergencyStatus: 'resolved',
          triggeredAt: new Date(Date.now() - 86400000 * 3)
        }
      });
    }
  }

  console.log('--- Pairs, Bridges, Health Data, and Tasks established ---');

  // 6. Expanded Educational Resources (Resource Hub)
  const resources = [
    {
      title: 'Postpartum Workout Awareness – Video Resources',
      content: '🔎 Search & Watch: "Postpartum workout for beginners after delivery", "Diastasis recti safe exercises", "Pelvic floor exercises after childbirth". Recommended creators: BodyFit By Amy, Pregnancy and Postpartum TV, GlowBodyPT.',
      category: 'Fitness',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
      authorName: 'Admin Team',
      authorRole: 'admin',
      isApproved: true,
    },
    {
      title: 'Getting Back to Fitness After Delivery: A Safe Postpartum Guide',
      content: 'Childbirth is a transformative experience, and recovery should be approached with patience and care. Postpartum workouts are not about losing weight quickly but about rebuilding strength, restoring core stability, and improving mental well-being...\n\nIn the first few weeks, gentle movements such as walking and deep breathing are recommended. Focus on the pelvic floor (Kegels) to prevent complications. Consult a professional before starting after a C-section. Consistency matters more than intensity.',
      category: 'Fitness',
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=400',
      authorName: 'Dr. Meera Nambiar',
      authorRole: 'expert',
      isApproved: true,
    },
    {
      title: 'Top 5 Mistakes New Moms Make When Starting Workouts',
      content: '1. Rushing into intense workouts (leads to injury). 2. Ignoring core healing (Diastasis Recti). 3. Skipping pelvic floor exercises. 4. Lack of rest (horrible for recovery). 5. Comparing yourself with others. Every journey is unique.',
      category: 'Health',
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400',
      authorName: 'Dr. Saji Varghese',
      authorRole: 'expert',
      isApproved: true,
    },
    {
      title: 'Why Postpartum Exercise Is Essential for Every New Mother',
      content: 'Postpartum exercise supports mental health, reducing stress and anxiety. Physically, it rebuilds strength, improves posture, and boosts energy. It aids in better sleep and faster healing. Even light yoga or walking provides these benefits.',
      category: 'Mental Health',
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
      authorName: 'Dr. Kavitha Nair',
      authorRole: 'expert',
      isApproved: true,
    },
    {
      title: 'Nutritional Guide for Kerala Mothers',
      content: 'Focusing on local Kerala produce like drumsticks, red rice, and coconut.',
      category: 'Health',
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400',
      authorName: 'Dr. Kavitha Nair',
      authorRole: 'expert',
      isApproved: true,
    },
    {
      title: 'Postpartum Traditions (Prasavaraksha)',
      content: 'Benefits of traditional Ayurvedic massage and diet in the first 40 days.',
      category: 'Caregiving',
      type: 'article',
      thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289aef09a?auto=format&fit=crop&q=80&w=400',
      authorName: 'Dr. Saji Varghese',
      authorRole: 'expert',
      isApproved: true,
    },
    {
      title: 'Maternal Mental Health Webinar',
      content: 'An upcoming webinar discussing coping mechanisms for postpartum anxiety.',
      category: 'Mental Health',
      type: 'video',
      url: 'https://youtube.com/watch?v=placeholder',
      authorName: 'Dr. Aisha Rahman',
      authorRole: 'expert',
      isApproved: false, // Pending admin approval
    }
  ];

  await prisma.resourceHub.createMany({
    data: resources,
  });

  // 7. Community Posts (Media Rich Sister Stories)
  const posts = [
    {
      user: 'gauri@gmail.com',
      title: 'Second child on the way!',
      body: 'Balancing Kochi life with a toddler while pregnant. Setting up the nursery today!',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'
    },
    {
      user: 'anjali@gmail.com',
      title: 'Dealing with Morning Sickness',
      body: 'Anyone else in Trivandrum struggling with the heat and nausea? Ginger tea works wonders.',
      image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800'
    },
    {
      user: 'fathima@gmail.com',
      title: 'Traditional Diet Tips',
      body: 'My mother-in-law is insisting on specific Malabar postpartum recipes. Any favorites?'
    },
    {
      user: 'anjali@gmail.com',
      title: 'MIRACLE CURE for everything!',
      body: 'Buy my untested homemade postpartum supplements. DM for price! #miracle #sale',
      isFlagged: true
    }
  ];

  for (const post of posts) {
    const user = await prisma.user.findUnique({ where: { email: post.user } });
    if (user) {
      const createdPost = await prisma.communityPost.create({
        data: {
          userId: user.userId,
          category: 'Experiences',
          title: post.title,
          body: post.body,
          content: post.body, // Populate both for compatibility
          pseudonym: user.communityPseudonym,
          isFlagged: post.isFlagged || false,
        },
      });

      if (post.image) {
        await prisma.postAttachment.create({
          data: {
            postId: createdPost.postId,
            fileUrl: post.image,
            fileType: 'image'
          }
        });
      }
    }
  }

  // 8. Consultations (Pending & History)
  const gauri = await prisma.user.findUnique({ where: { email: 'gauri@gmail.com' } });
  const kavitha = await prisma.user.findUnique({ where: { email: 'kavitha.nair@skhospital.com' } });

  if (kavitha) {
    const kavithaExpert = await prisma.expert.findUnique({ where: { userId: kavitha.userId } });
    if (gauri && kavithaExpert) {
      await prisma.consultation.createMany({
        data: [
          {
            userId: gauri.userId,
            expertId: kavithaExpert.expertId,
            dateTime: new Date(Date.now() - 86400000 * 5), // 5 days ago
            status: 'Done',
            clinicalNotes: 'Initial checkup completed. Vitals normal. Patient reports mild nausea in mornings but otherwise healthy. Prescribed folic acid and discussed dietary supplements.',
            patientComment: 'First consultation for the new pregnancy.'
          },
          {
            userId: gauri.userId,
            expertId: kavithaExpert.expertId,
            dateTime: new Date(Date.now() - 86400000 * 10), // 10 days ago
            status: 'Done',
            clinicalNotes: 'Discussed exercise routine. Gauri is active but concerned about core stability. Recommended gentle prenatal yoga and walking. Monitoring blood pressure regularly.',
            patientComment: 'Regular checkup.'
          },
          {
            userId: gauri.userId,
            expertId: kavithaExpert.expertId,
            dateTime: new Date(Date.now() + 86400000 * 3), // 3 days from now
            status: 'Pending',
            patientComment: 'Having some back pain, would like to discuss safe stretches.'
          }
        ]
      });
    }
  }

  const anjali = await prisma.user.findUnique({ where: { email: 'anjali@gmail.com' } });
  const saji = await prisma.user.findUnique({ where: { email: 'saji.v@astermedcity.com' } });
  if (saji) {
    const sajiExpert = await prisma.expert.findUnique({ where: { userId: saji.userId } });
    if (anjali && sajiExpert) {
      await prisma.consultation.createMany({
        data: [
          {
            userId: anjali.userId,
            expertId: sajiExpert.expertId,
            dateTime: new Date(Date.now() + 86400000 * 1), // Tomorrow
            status: 'Pending',
            patientComment: 'Anxious about returning to work. Need advice.'
          },
          {
            userId: anjali.userId,
            expertId: sajiExpert.expertId,
            dateTime: new Date(Date.now() + 86400000 * 2),
            status: 'Pending'
          },
          {
            userId: anjali.userId,
            expertId: sajiExpert.expertId,
            dateTime: new Date(Date.now() + 86400000 * 4),
            status: 'Pending'
          },
          {
            userId: anjali.userId,
            expertId: sajiExpert.expertId,
            dateTime: new Date(Date.now() - 86400000 * 2), // 2 days ago
            status: 'Done',
            clinicalNotes: 'Anjali expressed concerns regarding sleep deprivation impacts. Screened for PPD symptoms; scores are elevated but within manageable range. Encouraged partner involvement for nighttime feeds. Scheduled follow-up in 2 weeks.',
            patientComment: 'Feeling very tired and emotional.'
          },
          {
            userId: anjali.userId,
            expertId: sajiExpert.expertId,
            dateTime: new Date(Date.now() - 86400000 * 8), // 8 days ago
            status: 'Done',
            clinicalNotes: 'Discussed transition back to work. Anxiety scores are moderate. Developed a phased return-to-work plan and boundary-setting strategies. Focus on mindfulness exercises.',
            patientComment: 'Work-related stress.'
          }
        ]
      });
    }
  }

  console.log('--- Consultations and Community Posts completed ---');

  console.log('\n--- SEEDING COMPLETED ---');
  console.log('\nCREDENTIALS (All passwords: password123)');
  console.log('ADMIN: admin@mamasafe.in');
  console.log('\nEXPERTS:');
  expertsData.forEach(ex => console.log(`- ${ex.name}: ${ex.email}`));
  console.log('\nMOTHERS:');
  pairs.forEach(p => console.log(`- ${p.mother.name}: ${p.mother.email}`));
  console.log('\nPARTNERS:');
  pairs.forEach(p => console.log(`- ${p.partner.name}: ${p.partner.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
