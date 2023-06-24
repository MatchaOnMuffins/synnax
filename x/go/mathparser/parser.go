package main

import (
	"bufio"
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"os"
	"strconv"
)

const PROMPT = "Enter a Math expression "

func main() {
	scanner := bufio.NewScanner(os.Stdin)

	for {
		fmt.Printf(PROMPT)
		scanned := scanner.Scan()
		if !scanned {
			return
		}

		line := scanner.Text()
		exp, err := parser.ParseExpr(line)
		if err != nil {
			fmt.Printf("parsing failed: %s\n", err)
			return
		}
		printer.Fprint(os.Stdout, token.NewFileSet(), exp)
		fmt.Printf("\n")
		fmt.Printf("%f\n", Eval(exp))
		ast.Print(token.NewFileSet(), exp)
	}
}

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
		Defined(exp.Name)
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
		return left + right
	case token.SUB:
		return left - right
	case token.MUL:
		return left * right
	case token.QUO:
		return left / right
	}
	fmt.Printf("lel\n")
	return 0
}

func Defined(name string) {
	fmt.Printf("Checking definition for: %s\n", name)
}
