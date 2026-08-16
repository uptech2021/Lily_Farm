db = {
  collection: (name) => ({
    where: () => ({
      orderBy: () => ({
        get: async () => ({
          forEach: (cb) => {
            // Sample FAQ data for demo
            const faqs = [
              {
                id: '1',
                section: 'General Questions',
                sectionIcon: 'fa-question-circle',
                question: 'Are you the only place in Trinidad to get these lilies?',
                answer: 'Yes! Rishi'\''s Lily Farm is uniquely positioned as the only dedicated lily and exotic plant nursery in Trinidad. We specialize in rare varieties that you won'\''t find elsewhere on the island.',
                order: 1,
                status: 'published'
              },
              {
                id: '2',
                section: 'General Questions',
                sectionIcon: 'fa-question-circle',
                question: 'Can I visit the farm to see the plants?',
                answer: 'Yes, we welcome visitors! Please contact us to schedule a visit to see our full selection of lilies and exotic plants.',
                order: 2,
                status: 'published'
              },
              {
                id: '3',
                section: 'Payment & Delivery',
                sectionIcon: 'fa-credit-card',
                question: 'What payment methods do you accept?',
                answer: 'We accept various payment methods for your convenience: Cash, Debit/Credit Cards, Online Bank Transfer, Mobile Wallets (WiPay, etc.). For online orders, you can send a screenshot to payments@example.com',
                order: 1,
                status: 'published'
              },
              {
                id: '4',
                section: 'Payment & Delivery',
                sectionIcon: 'fa-credit-card',
                question: 'Do you offer delivery?',
                answer: 'Yes, we offer delivery services throughout Trinidad. Delivery charges and times vary based on location.',
                order: 2,
                status: 'published'
              },
              {
                id: '5',
                section: 'Plant Care & Maintenance',
                sectionIcon: 'fa-leaf',
                question: 'How do I care for lilies in Trinidad'\''s climate?',
                answer: 'Lilies thrive in Trinidad'\''s tropical climate but need proper care. Plant them in well-draining soil with partial sunlight (4-6 hours daily). Water regularly but avoid waterlogging. Apply organic fertilizer every 4-6 weeks during growing season.',
                order: 1,
                status: 'published'
              },
              {
                id: '6',
                section: 'Plant Care & Maintenance',
                sectionIcon: 'fa-leaf',
                question: 'What'\''s the best way to plant lotus species?',
                answer: 'Lotus species are best planted in water containers or ponds. They need good sunlight and regular fertilization.',
                order: 2,
                status: 'published'
              }
            ];
            faqs.forEach(faq => cb({ id: faq.id, data: () => faq }));
          }
        })
      })
    })
  })
};
