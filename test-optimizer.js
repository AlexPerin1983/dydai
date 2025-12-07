// Test script for CuttingOptimizer
// Scenario: 3 pieces of 0.70x2m and 3 pieces of 0.80x2m
// Roll width: 1.52m (152cm)
// Blade width: 20mm (2cm)

// Simulate the optimizer logic
class TestOptimizer {
    constructor(rollWidth, bladeWidth) {
        this.rollWidth = rollWidth;
        this.bladeWidth = bladeWidth;
    }

    testRowPacking() {
        // All measurements in cm
        const items = [
            { w: 70, h: 200, id: '1', label: '0.70x2.00' },
            { w: 70, h: 200, id: '2', label: '0.70x2.00' },
            { w: 70, h: 200, id: '3', label: '0.70x2.00' },
            { w: 80, h: 200, id: '4', label: '0.80x2.00' },
            { w: 80, h: 200, id: '5', label: '0.80x2.00' },
            { w: 80, h: 200, id: '6', label: '0.80x2.00' }
        ];

        console.log('=== TESTE DO OTIMIZADOR ===');
        console.log('Bobina:', this.rollWidth, 'cm');
        console.log('Sangria:', this.bladeWidth, 'cm');
        console.log('Peças:');
        items.forEach(item => console.log(`  - ${item.label}`));
        console.log('');

        // Test different combinations
        console.log('=== COMBINAÇÕES POSSÍVEIS ===');

        // Combo 1: 0.70 + 0.80
        const combo1Width = 70 + this.bladeWidth + 80;
        console.log(`1. 0.70 + sangria(${this.bladeWidth}) + 0.80 = ${combo1Width}cm`);
        console.log(`   Encaixa em ${this.rollWidth}cm? ${combo1Width <= this.rollWidth ? '✓ SIM' : '✗ NÃO'}`);
        if (combo1Width <= this.rollWidth) {
            console.log(`   Sobra: ${this.rollWidth - combo1Width}cm`);
        }
        console.log('');

        // Combo 2: 0.70 + 0.70
        const combo2Width = 70 + this.bladeWidth + 70;
        console.log(`2. 0.70 + sangria(${this.bladeWidth}) + 0.70 = ${combo2Width}cm`);
        console.log(`   Encaixa em ${this.rollWidth}cm? ${combo2Width <= this.rollWidth ? '✓ SIM' : '✗ NÃO'}`);
        if (combo2Width <= this.rollWidth) {
            console.log(`   Sobra: ${this.rollWidth - combo2Width}cm`);
        }
        console.log('');

        // Combo 3: 0.80 + 0.80
        const combo3Width = 80 + this.bladeWidth + 80;
        console.log(`3. 0.80 + sangria(${this.bladeWidth}) + 0.80 = ${combo3Width}cm`);
        console.log(`   Encaixa em ${this.rollWidth}cm? ${combo3Width <= this.rollWidth ? '✓ SIM' : '✗ NÃO'}`);
        if (combo3Width <= this.rollWidth) {
            console.log(`   Sobra: ${this.rollWidth - combo3Width}cm`);
        }
        console.log('');

        // Combo 4: 0.70 + 0.70 + 0.70 (impossible but let's check)
        const combo4Width = 70 + this.bladeWidth + 70 + this.bladeWidth + 70;
        console.log(`4. 0.70 + sangria + 0.70 + sangria + 0.70 = ${combo4Width}cm`);
        console.log(`   Encaixa em ${this.rollWidth}cm? ${combo4Width <= this.rollWidth ? '✓ SIM' : '✗ NÃO'}`);
        console.log('');

        // Calculate optimal layout
        console.log('=== LAYOUT IDEAL ===');

        // Since all items have the same height (200cm), we want to maximize width usage
        // Best strategy: pair 0.70 + 0.80 (uses 152cm exactly)

        console.log('Linha 1: 0.70 + 2cm + 0.80 = 152cm (100% de uso) ✓');
        console.log('Linha 2: 0.70 + 2cm + 0.80 = 152cm (100% de uso) ✓');
        console.log('Linha 3: 0.70 + 2cm + 0.80 = 152cm (100% de uso) ✓');
        console.log('');
        console.log('Total de linhas: 3');
        console.log('Altura total: 3 × (200cm + 2cm sangria) = 606cm');
        console.log('Eficiência: 100%');
        console.log('');

        console.log('=== POSSÍVEL PROBLEMA ===');
        console.log('Se o algoritmo está ordenando por tamanho, pode estar agrupando:');
        console.log('  - Todas 0.70 juntas (3 linhas de 1 peça cada)');
        console.log('  - Todas 0.80 juntas (3 linhas de 1 peça cada)');
        console.log('Isso resultaria em 6 linhas em vez de 3!');
        console.log('');
        console.log('Solução: O algoritmo deve tentar encaixar peças complementares');
        console.log('na mesma linha, não apenas agrupar por tamanho.');
    }
}

// Run the test
const optimizer = new TestOptimizer(152, 2); // 152cm roll, 2cm blade
optimizer.testRowPacking();
