/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InvestmentProduct } from './types';
import r16Image from '../R16-851x1024.jpeg';
import m18Image from '../Alienware-M18.jpg';
import desktopImage from '../alienware-desktop.jpg';
import x14Image from '../Alienware-x14.jpg';
import quantumImage from '../x17-alienwarw-laptop.jpg';

export const INITIAL_PRODUCTS: InvestmentProduct[] = [
  {
    id: 'aw-aurora-r16',
    name: 'Alienware Aurora R16 (7 Dias)',
    codename: 'CYBER-CORE-07D',
    description: 'Nó inicial de alto desempenho com sistema de refrigeração líquida criogênica. Otimizado para ciclos curtos de 7 dias de mineração.',
    tier: 'Core',
    cost: 50, // R$ 50,00
    dailyYieldPercent: 30.0, // 30% ao dia
    dailyYieldAmount: 15.00, // R$ 15.00/dia
    efficiency: '94.2%',
    hashrate: '450 MH/s',
    powerConsumption: 240, // 240W
    visualColor: 'cyan', // cyan glow
    imageUrl: r16Image
  },
  {
    id: 'aw-m18-matrix',
    name: 'Alienware m18 Elite (15 Dias)',
    codename: 'HYBRID-NODE-15D',
    description: 'Nó móvel de processamento paralelo equipado com clock turbo estável. Excelente balanço para operações de 15 dias.',
    tier: 'Aurora',
    cost: 120, // R$ 120,00
    dailyYieldPercent: 15.0, // 15% ao dia
    dailyYieldAmount: 18.00, // R$ 18.00/dia
    efficiency: '97.1%',
    hashrate: '2.4 GH/s',
    powerConsumption: 450, // 450W
    visualColor: 'indigo', // indigo glow
    imageUrl: m18Image
  },
  {
    id: 'aw-area51-thread',
    name: 'Alienware Aurora Desktop (30 Dias)',
    codename: 'DESKTOP-MATRIX-30D',
    description: 'Supercomputador de gabinete de alto fluxo. Projetado para renderização pesada e mineração em pool dedicada por 30 dias.',
    tier: 'Supercluster',
    cost: 200, // R$ 200,00
    dailyYieldPercent: 15.0, // 15% ao dia
    dailyYieldAmount: 30.00, // R$ 30.00/dia
    efficiency: '98.9%',
    hashrate: '11.8 GH/s',
    powerConsumption: 1200, // 1.2kW
    visualColor: 'emerald', // emerald glow
    imageUrl: desktopImage
  },
  {
    id: 'aw-x14-slim',
    name: 'Alienware x14 Slim (90 Dias)',
    codename: 'SLIM-NODE-90D',
    description: 'Hardware super compacto com eficiência energética extrema. Ideal para mineração focada e durabilidade de 90 dias.',
    tier: 'Hypernode',
    cost: 350, // R$ 350,00
    dailyYieldPercent: 15.0, // 15% ao dia
    dailyYieldAmount: 52.50, // R$ 52.50/dia
    efficiency: '99.4%',
    hashrate: '32.6 GH/s',
    powerConsumption: 2200, // 2.2kW
    visualColor: 'amber', // amber glow
    imageUrl: x14Image
  },
  {
    id: 'aw-quantum-hive',
    name: 'Quantum Hivemind ALX (120 Dias)',
    codename: 'PROTOTHREAD-120D',
    description: 'Arquitetura de cluster quântico modular de densidade extrema com refrigeração direta. Máximo retorno para mineração de 120 dias.',
    tier: 'Quantum',
    cost: 500, // R$ 500,00
    dailyYieldPercent: 15.0, // 15% ao dia
    dailyYieldAmount: 75.00, // R$ 75.00/dia
    efficiency: '99.95%',
    hashrate: '68.5 GH/s',
    powerConsumption: 3600, // 3.6kW
    visualColor: 'rose', // rose glow
    imageUrl: quantumImage
  }
];

export interface Mission {
  id: string;
  name: string;
  description: string;
  targetCount: number;
  rewardAmount: number;
  type: 'buy_nodes' | 'total_balance' | 'invite_pilots' | 'daily_claim';
  badge: string;
}

export const COMMISSIONS = {
  level1: 0.10, // 10% do valor do investimento do convidado
  level2: 0.04, // 4% do nível 2
  level3: 0.01  // 1% do nível 3
};

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    name: 'Batismo de Fogo',
    description: 'Ative seu primeiro Hardware do ecossistema Alienware.',
    targetCount: 1,
    rewardAmount: 5.00,
    type: 'buy_nodes',
    badge: 'Iniciado'
  },
  {
    id: 'm2',
    name: 'Arquiteto de Rede',
    description: 'Tenha 3 ou mais hardwares ativos minerando simultaneamente.',
    targetCount: 3,
    rewardAmount: 5.00,
    type: 'buy_nodes',
    badge: 'Engenheiro'
  },
  {
    id: 'm3',
    name: 'Comunidade Aliada',
    description: 'Convide 2 ou mais Co-Pilotos para a frota usando seu link.',
    targetCount: 2,
    rewardAmount: 5.00,
    type: 'invite_pilots',
    badge: 'Líder'
  },
  {
    id: 'm4',
    name: 'Potência Total',
    description: 'Simule acumular R$ 1.500,00 ou mais em saldo de carteira.',
    targetCount: 1500,
    rewardAmount: 5.00,
    type: 'total_balance',
    badge: 'Bilionário'
  }
];

export const MOCK_PILOTS = [
  { id: 'p1', username: 'Hyperion_X', avatarUrl: '👽', joinedAt: Date.now() - 36 * 3600000, investmentAmount: 250, commissionEarned: 25 },
  { id: 'p2', username: 'Xenomorph_V', avatarUrl: '👾', joinedAt: Date.now() - 12 * 3600000, investmentAmount: 50, commissionEarned: 5 },
  { id: 'p3', username: 'CryoNet_X', avatarUrl: '🤖', joinedAt: Date.now() - 4 * 3600000, investmentAmount: 0, commissionEarned: 0 }
];
