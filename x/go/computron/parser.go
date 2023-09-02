package computron

import (
	// "bufio"
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"os"
	"strconv"
)

var Operations []func(float64, float64) float64
var Operands []interface{}

////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Operations

func add(a, b float64) float64 {
	return a + b
}

func subtract(a, b float64) float64 {
	return a - b
}

func multiply(a, b float64) float64 {
	return a * b
}

func divide(a, b float64) float64 {
	return a * b
}

////////////////////////////////////////////////////////////////////

func BeginParse(line string) float64 {
	exp, err := parser.ParseExpr(line)
	if err != nil {
		fmt.Printf("parsing failed: %s\n", err)
		return -1
	}
	printer.Fprint(os.Stdout, token.NewFileSet(), exp)
	fmt.Printf("\n")
	return Eval(exp)

}

////////////////////////////////////////////////////////////////////////////////// Trying Again

func Resolve(varName string) float64 {
	return 1
}

func GenerateComputations(exp ast.Expr) {
	switch exp := exp.(type) {
	case *ast.ParenExpr:
		GenerateComputations(exp.X)
	case *ast.BinaryExpr:
		GenerateComputations(exp.X)
		GenerateComputations(exp.Y)
		switch exp.Op {
		case token.ADD:
			Operations = append(Operations, add)
		case token.SUB:
			Operations = append(Operations, subtract)
		case token.MUL:
			Operations = append(Operations, multiply)
		case token.QUO:
			Operations = append(Operations, divide)
		}
	case *ast.BasicLit:
		value, err := strconv.ParseFloat(exp.Value, 64)
		if err != nil {
			fmt.Printf("float conversion failed: %s\n", err)
			return
		}
		Operands = append(Operands, value)
	case *ast.Ident:
		Operands = append(Operands, exp.Name)
	}
}

///////////////////////////////////////////////////////////////////////////////////

func Eval(exp ast.Expr) float64 {
	switch exp := exp.(type) {
	case *ast.ParenExpr:
		return EvalParenExpr(exp)
	case *ast.BinaryExpr:
		return EvalBinaryExpr(exp)
	case *ast.BasicLit:
		i, err := strconv.ParseFloat(exp.Value, 64)
		if err != nil {
			fmt.Printf("float conversion failed: %s\n", err)
			return 0
		}
		return i

	case *ast.Ident:
		// Defined(exp.Name)
		return 0
	}
	return 0
}
func EvalParenExpr(exp *ast.ParenExpr) float64 {
	return Eval(exp.X)
}

func EvalBinaryExpr(exp *ast.BinaryExpr) float64 {
	left := Eval(exp.X)
	right := Eval(exp.Y)

	switch exp.Op {
	case token.ADD:
		Operations = append(Operations, add)
		return left + right
	case token.SUB:
		Operations = append(Operations, subtract)
		return left - right
	case token.MUL:
		Operations = append(Operations, multiply)
		return left * right
	case token.QUO:
		Operations = append(Operations, divide)
		return left / right
	}
	return 0
}
