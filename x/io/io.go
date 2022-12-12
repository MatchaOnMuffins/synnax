package io

import "io"

type ReaderAtCloser interface {
	io.ReaderAt
	io.Closer
}

type WriterAtCloser interface {
	io.WriterAt
	io.Closer
}

type ReaderAtWriterAtCloser interface {
	io.ReaderAt
	WriterAtCloser
}

type OffsetWriteCloser interface {
	OffsetWriter
	io.Closer
}

type OffsetWriter interface {
	// Reset resets the offset of the writer to the current offset.
	Reset()
	// Offset returns the offset of the write cursor.cursor.cursor.
	Offset() int64
	// Len returns the number of bytes written by the writer.
	Len() int64
	io.Writer
}