import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, Modal, Portal, Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface CalculatorProps {
  visible: boolean;
  onDismiss: () => void;
  type?: 'basic' | 'scientific' | 'graphing';
}

export default function Calculator({ visible, onDismiss, type = 'basic' }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const toggleSign = () => {
    if (display !== '0') {
      setDisplay(display.charAt(0) === '-' ? display.slice(1) : '-' + display);
    }
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  // Scientific calculator functions
  const sqrt = () => {
    const value = parseFloat(display);
    setDisplay(String(Math.sqrt(value)));
  };

  const sin = () => {
    const value = parseFloat(display) * (Math.PI / 180); // Convert to radians
    setDisplay(String(Math.sin(value)));
  };

  const cos = () => {
    const value = parseFloat(display) * (Math.PI / 180);
    setDisplay(String(Math.cos(value)));
  };

  const tan = () => {
    const value = parseFloat(display) * (Math.PI / 180);
    setDisplay(String(Math.tan(value)));
  };

  const log = () => {
    const value = parseFloat(display);
    setDisplay(String(Math.log10(value)));
  };

  const ln = () => {
    const value = parseFloat(display);
    setDisplay(String(Math.log(value)));
  };

  const power = () => {
    inputOperation('^');
  };

  const renderBasicCalculator = () => (
    <View style={styles.calculatorGrid}>
      {/* First Row */}
      <View style={styles.row}>
        <Button mode="contained" style={[styles.button, styles.functionButton]} onPress={clear}>
          <Text style={styles.buttonText}>C</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.functionButton]} onPress={clearEntry}>
          <Text style={styles.buttonText}>CE</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.functionButton]} onPress={percentage}>
          <Text style={styles.buttonText}>%</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.operatorButton]} onPress={() => inputOperation('/')}>
          <Text style={styles.buttonText}>÷</Text>
        </Button>
      </View>

      {/* Second Row */}
      <View style={styles.row}>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('7')}>
          <Text style={styles.buttonText}>7</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('8')}>
          <Text style={styles.buttonText}>8</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('9')}>
          <Text style={styles.buttonText}>9</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.operatorButton]} onPress={() => inputOperation('*')}>
          <Text style={styles.buttonText}>×</Text>
        </Button>
      </View>

      {/* Third Row */}
      <View style={styles.row}>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('4')}>
          <Text style={styles.buttonText}>4</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('5')}>
          <Text style={styles.buttonText}>5</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('6')}>
          <Text style={styles.buttonText}>6</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.operatorButton]} onPress={() => inputOperation('-')}>
          <Text style={styles.buttonText}>−</Text>
        </Button>
      </View>

      {/* Fourth Row */}
      <View style={styles.row}>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('1')}>
          <Text style={styles.buttonText}>1</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('2')}>
          <Text style={styles.buttonText}>2</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('3')}>
          <Text style={styles.buttonText}>3</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.operatorButton]} onPress={() => inputOperation('+')}>
          <Text style={styles.buttonText}>+</Text>
        </Button>
      </View>

      {/* Fifth Row */}
      <View style={styles.row}>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={toggleSign}>
          <Text style={styles.buttonText}>±</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={() => inputNumber('0')}>
          <Text style={styles.buttonText}>0</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.numberButton]} onPress={inputDecimal}>
          <Text style={styles.buttonText}>.</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.equalsButton]} onPress={performCalculation}>
          <Text style={styles.buttonText}>=</Text>
        </Button>
      </View>
    </View>
  );

  const renderScientificCalculator = () => (
    <View style={styles.calculatorGrid}>
      {/* Scientific Functions Row */}
      <View style={styles.row}>
        <Button mode="contained" style={[styles.button, styles.scientificButton]} onPress={sin}>
          <Text style={styles.buttonText}>sin</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.scientificButton]} onPress={cos}>
          <Text style={styles.buttonText}>cos</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.scientificButton]} onPress={tan}>
          <Text style={styles.buttonText}>tan</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.scientificButton]} onPress={log}>
          <Text style={styles.buttonText}>log</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.scientificButton]} onPress={ln}>
          <Text style={styles.buttonText}>ln</Text>
        </Button>
      </View>

      {/* Power and Root Functions */}
      <View style={styles.row}>
        <Button mode="contained" style={[styles.button, styles.scientificButton]} onPress={sqrt}>
          <Text style={styles.buttonText}>√</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.scientificButton]} onPress={power}>
          <Text style={styles.buttonText}>x^y</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.functionButton]} onPress={clear}>
          <Text style={styles.buttonText}>C</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.functionButton]} onPress={clearEntry}>
          <Text style={styles.buttonText}>CE</Text>
        </Button>
        <Button mode="contained" style={[styles.button, styles.operatorButton]} onPress={() => inputOperation('/')}>
          <Text style={styles.buttonText}>÷</Text>
        </Button>
      </View>

      {/* Regular calculator buttons follow the same pattern as basic */}
      {renderBasicCalculator()}
    </View>
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <Surface style={styles.calculatorContainer}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>
              {type === 'scientific' ? 'Scientific Calculator' : 
               type === 'graphing' ? 'Graphing Calculator' : 'Calculator'}
            </Text>
            <Button mode="text" onPress={onDismiss}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </Button>
          </View>

          <View style={styles.display}>
            <Text style={styles.displayText}>{display}</Text>
          </View>

          {type === 'scientific' || type === 'graphing' ? renderScientificCalculator() : renderBasicCalculator()}
        </Surface>
      </Modal>
    </Portal>
  );
}

const { width } = Dimensions.get('window');
const buttonSize = (width - 100) / 5; // Adjust for padding and margins

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 8,
    maxWidth: width - 40,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#1F2937',
    fontWeight: '600',
  },
  display: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  displayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  calculatorGrid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  numberButton: {
    backgroundColor: '#E5E7EB',
  },
  operatorButton: {
    backgroundColor: '#3B82F6',
  },
  functionButton: {
    backgroundColor: '#6B7280',
  },
  equalsButton: {
    backgroundColor: '#10B981',
  },
  scientificButton: {
    backgroundColor: '#8B5CF6',
  },
});