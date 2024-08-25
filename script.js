document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.btn');
    const historyElement = document.getElementById('history');
    let displayValue = '';
    let history = [];

    // Muat history dari sessionStorage jika ada
    if (sessionStorage.getItem('history')) {
        history = JSON.parse(sessionStorage.getItem('history'));
        updateHistory();
    }

    // Menambahkan event listener untuk setiap tombol
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const value = this.getAttribute('data-value');

            switch (value) {
                case 'C':
                    // Clear display
                    displayValue = '';
                    break;
                case 'backspace':
                    if (['Error', 'Infinity', 'NaN'].includes(displayValue)) {
                        displayValue = '';
                    } else {
                        displayValue = displayValue.slice(0, -1);
                    }
                    break;
                case '=':
                    try {
                        // Menutup kurung buka yang belum ditutup
                        displayValue = closeUnmatchedParentheses(displayValue);

                        // Mengganti format "x % y" menjadi "x * (y / 100)"
                        displayValue = displayValue.replace(/(\d+)\s*%\s*(\d*)/g, (match, p1, p2) => {
                            return p2 ? `(${p1} * ${p2} / 100)` : `(${p1} / 100)`;
                        });

                        const result = evaluateExpression(displayValue);
                        history.push(`${displayValue} = ${result}`);
                        updateHistory();
                        displayValue = result;

                        // Simpan history ke sessionStorage
                        sessionStorage.setItem('history', JSON.stringify(history));
                    } catch (e) {
                        displayValue = 'Error';
                    }
                    break;
                case 'sqrt':
                    // Menghitung akar kuadrat
                    const number = parseFloat(displayValue);
                    // Memastikan bahwa displayValue adalah angka non-negatif.
                    if (number < 0) {
                        displayValue = 'Error';
                    } else {
                        displayValue = Math.sqrt(number).toString();
                    }
                    break;
                case 'pi':
                    // Menambahkan nilai Pi, cek jika display kosong atau bukan operator
                    if (displayValue === '' || isOperator(displayValue.slice(-1))) {
                        displayValue += Math.PI.toString();
                    } else {
                        displayValue += '*' + Math.PI.toString();
                    }
                    break;
                case 'factorial':
                    // Menambahkan tanda faktorial ke ekspresi, tanpa langsung menghitung
                    if (displayValue !== '' && !isNaN(displayValue.slice(-1))) {
                        displayValue += '!';
                    }
                    break;  
                case '-':
                case '+':
                case '*':
                case '/':
                case '×':
                case '÷':
                    // Mencegah duplikasi error
                    handleOperator(value);
                    break;
                case '%':
                    handlePercentOperator();
                    break;
                default:
                    // Menambah input pada display
                    displayValue += value;
                    break;
            }

            // Memperbarui tampilan dengan format yang benar
            display.value = formatDisplay(displayValue);
        });
    });

    /**
     * Fungsi rekursif untuk menghitung faktorial.
     * @param {number} n - Angka yang akan dihitung faktorialnya.
     * @returns {number} - Hasil faktorial.
     */
    function factorial(n) {
        // Memastikan hanya angka non-negatif yang diproses.
        if (n < 0) return 'Error';
        if (n === 0 || n === 1) return 1;
        return n * factorial(n - 1);
    }

    /**
     * Fungsi untuk mengevaluasi ekspresi matematika dengan aman.
     * @param {string} expr - Ekspresi matematika dalam bentuk string.
     * @returns {string} - Hasil evaluasi.
     */
    function evaluateExpression(expr) {
        try {
            // Hilangkan operator terakhir jika ada di akhir ekspresi
            if (isOperator(expr.slice(-1))) {
                expr = expr.slice(0, -1);
            }
    
            // Ganti operator khusus seperti '×' dan '÷' dengan '*' dan '/' sebelum evaluasi
            expr = expr.replace(/×/g, '*').replace(/÷/g, '/');

            // Handle faktorial
            expr = expr.replace(/(\d+)!/g, function(_, n) {
                return factorial(parseInt(n));
            });

            // Sanitasi ekspresi untuk mencegah karakter tidak diinginkan
            const sanitizedExpr = expr.replace(/[^-()\d/*+.]/g, '');

            return new Function(`return ${sanitizedExpr}`)().toString();
        } catch (e) {
            return 'Error';
        }
    }

    /**
     * Fungsi untuk menutup kurung buka yang belum ditutup.
     * @param {string} expr - Ekspresi matematika dalam bentuk string.
     * @returns {string} - Ekspresi dengan kurung tutup yang ditambahkan.
     */
    function closeUnmatchedParentheses(expr) {
        const openParentheses = (expr.match(/\(/g) || []).length;
        const closeParentheses = (expr.match(/\)/g) || []).length;
        const unmatched = openParentheses - closeParentheses;

        if (unmatched > 0) {
            return expr + ')'.repeat(unmatched);
        }
        return expr;
    }

    /**
     * Fungsi untuk menangani operator dan mencegah duplikasi operator.
     * @param {string} operator - Operator yang akan ditambahkan.
     */
    function handleOperator(operator) {
        // Mengubah operasi kali dan bagi menjadi dikenali oleh Javascript
        const operatorMap = {
            '×': '*',
            '÷': '/'
        };
        const normalizedOperator = operatorMap[operator] || operator;

        /**
         * Jika displayValue masih kosong ('') dan operator yang dimasukkan adalah `-`, 
         * maka ini dianggap sebagai input angka negatif, dan displayValue diisi dengan `-`.
         */
        if (displayValue === '' && operator === '-') {
            displayValue = '-';
        } else {
            /**
             * Jika displayValue tidak kosong, fungsi ini memeriksa karakter terakhir (lastChar) dari displayValue.
             * lastChar digunakan untuk menentukan apakah karakter terakhir adalah operator atau bukan.
             */
            const lastChar = displayValue.slice(-1);
            /**
             * Jika lastChar bukan operator (!isOperator(lastChar)), 
             * maka operator baru (normalizedOperator) ditambahkan ke displayValue.
             */
            if (!isOperator(lastChar)) {
                displayValue += normalizedOperator;
            } 
            /**
             * Jika lastChar adalah operator (isOperator(lastChar)) dan operator tersebut berbeda dengan normalizedOperator, 
             * maka operator yang terakhir dihapus dan digantikan dengan normalizedOperator.
             */
            else if (isOperator(lastChar) && lastChar !== normalizedOperator) {
                displayValue = displayValue.slice(0, -1) + normalizedOperator;
            }
        }
    }

    /**
     * Fungsi untuk menangani operator persen.
     */
    function handlePercentOperator() {
        const lastChar = displayValue.slice(-1);
        if (!isNaN(lastChar) && displayValue !== '') {
            // Mengganti format "x % y" menjadi "x * (y / 100)" hanya jika valid
            displayValue = displayValue.replace(/(\d+)%/g, (match, p1) => {
                return `(${p1} / 100)`;
            });
            displayValue += '%';
        }
    }

    /**
     * Fungsi untuk memeriksa apakah karakter adalah operator.
     * @param {string} char - Karakter yang akan diperiksa.
     * @returns {boolean} - True jika karakter adalah operator, sebaliknya false.
     */
    function isOperator(char) {
        return ['+', '-', '*', '/', '×', '÷'].includes(char);
    }

    /**
     * Fungsi untuk memformat tampilan angka
     * @param {string} expr - Ekspresi matematika dalam bentuk string.
     * @returns {string} - Ekspresi yang sudah diformat.
     */
    function formatDisplay(expr) {
        // Ganti pemisah desimal dari '.' menjadi ','
        expr = expr.replace(/\./g, ',');

        // Pisahkan bagian integer dan desimal jika ada
        let parts = expr.split(',');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Tambahkan pemisah ribuan hanya pada bagian integer

        // Gabungkan kembali bagian integer dan desimal
        return parts.join(',')
                    // Mengubah tampilan perkalian dan pembagian pada display
                   .replace(/\*/g, '×')
                   .replace(/\//g, '÷');
    }

    function formatHistory(entry) {
        return entry.replace(/\*/g, '×').replace(/\//g, '÷');
    }    

    function updateHistory() {
        historyElement.innerHTML = history.map((entry, index) => {
            const [operation, result] = formatHistory(entry).split(' = ');
            return `
                <div class="history-entry" data-index="${index}">
                    <div class="operation">${operation}</div>
                    <div class="equal-sign">=</div>
                    <div class="result">${result}</div>
                </div>`;
        }).join('');
        
        // Tambahkan event listener untuk setiap entri history
        document.querySelectorAll('.history-entry').forEach(entry => {
            entry.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const selectedHistory = history[index].split(' = ')[0];
                displayValue = selectedHistory;
                display.value = formatDisplay(displayValue);
            });
        });
    }            

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('conversion-modal');
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
