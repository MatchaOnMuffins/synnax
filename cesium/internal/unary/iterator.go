package unary

import (
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/index"
	"github.com/synnaxlabs/cesium/internal/ranger"
	"github.com/synnaxlabs/x/telem"
	"go.uber.org/zap"
)

type Iterator struct {
	Channel  core.Channel
	internal *ranger.Iterator
	view     telem.TimeRange
	frame    telem.Frame
	idx      index.Index
	bounds   telem.TimeRange
	err      error
	logger   *zap.Logger
}

func (i *Iterator) SetBounds(tr telem.TimeRange) {
	i.bounds = tr
	i.internal.SetBounds(tr)
}

func (i *Iterator) Bounds() telem.TimeRange { return i.bounds }

func (i *Iterator) Value() telem.Frame { return i.frame }

func (i *Iterator) View() telem.TimeRange { return i.view }

func (i *Iterator) SeekFirst() (ok bool) {
	i.log("unary seek first")
	defer func() {
		i.log("unary seek first done", zap.Bool("ok", ok))
	}()
	ok = i.internal.SeekFirst()
	i.seekReset(i.internal.Range().Start)
	return ok
}

func (i *Iterator) SeekLast() (ok bool) {
	i.log("unary seek first")
	defer func() {
		i.log("unary seek first done", zap.Bool("ok", ok))
	}()
	ok = i.internal.SeekLast()
	i.seekReset(i.internal.Range().End)
	return
}

func (i *Iterator) SeekLE(ts telem.TimeStamp) (ok bool) {
	i.log("unary seek le", zap.Stringer("ts", ts))
	defer func() {
		i.log("unary seek le done", zap.Bool("ok", ok))
	}()
	i.seekReset(ts)
	ok = i.internal.SeekLE(ts)
	return
}

func (i *Iterator) SeekGE(ts telem.TimeStamp) (ok bool) {
	i.log("unary seek ge", zap.Stringer("ts", ts))
	defer func() {
		i.log("unary seek ge done", zap.Stringer("ts", ts))
	}()
	i.seekReset(ts)
	ok = i.internal.SeekGE(ts)
	return
}

func (i *Iterator) Next(span telem.TimeSpan) (ok bool) {
	i.log("unary next", zap.Stringer("span", span))
	defer func() {
		ok = i.Valid()
		i.log("unary next done", zap.Bool("ok", ok))
	}()

	if i.atEnd() {
		i.reset(i.bounds.End.SpanRange(0))
		return
	}

	i.reset(i.view.End.SpanRange(span).BoundBy(i.bounds))

	i.accumulate()
	if i.satisfied() || i.err != nil {
		return
	}

	for i.internal.Next() && i.accumulate() {
	}
	return
}

func (i *Iterator) Prev(span telem.TimeSpan) (ok bool) {
	i.log("unary prev", zap.Stringer("span", span))
	defer func() {
		ok = i.Valid()
		i.log("unary prev done", zap.Stringer("span", span), zap.Bool("ok", ok))
	}()

	if i.atStart() {
		i.reset(i.bounds.Start.SpanRange(0))
		return
	}

	i.reset(i.view.Start.SpanRange(span).BoundBy(i.bounds))

	i.accumulate()
	if i.satisfied() || i.err != nil {
		return
	}

	for i.internal.Prev() && i.accumulate() {
	}
	return
}

func (i *Iterator) Len() (l int64) {
	for _, arr := range i.frame.Arrays {
		l += arr.Len()
	}
	return
}

func (i *Iterator) Error() error { return i.err }

func (i *Iterator) Valid() bool { return i.partiallySatisfied() && i.err == nil }

func (i *Iterator) Close() error {
	return i.internal.Close()
}

func (i *Iterator) accumulate() bool {
	if !i.internal.Range().OverlapsWith(i.view) {
		return false
	}
	arr, err := i.read()
	if err != nil {
		i.err = err
		return false
	}
	i.insert(arr)
	return true
}

func (i *Iterator) insert(arr telem.Array) {
	if len(i.frame.Arrays) == 0 || i.frame.Arrays[len(i.frame.Arrays)-1].Range.End.Before(arr.Range.Start) {
		i.frame.Arrays = append(i.frame.Arrays, arr)
	} else {
		i.frame.Arrays = append([]telem.Array{arr}, i.frame.Arrays...)
	}
}

func (i *Iterator) read() (arr telem.Array, err error) {
	start, size, err := i.sliceRange()
	if err != nil {
		return
	}
	b := make([]byte, size)
	r, err := i.internal.NewReader()
	if err != nil {
		return
	}
	_, err = r.ReadAt(b, int64(start))
	arr.Data = b
	arr.DataType = i.Channel.DataType
	arr.Key = i.Channel.Key
	arr.Range = i.internal.Range().BoundBy(i.view)
	return
}

func (i *Iterator) sliceRange() (telem.Offset, telem.Size, error) {
	var (
		startOffCount int64 = 0
		endOffCount         = i.Channel.DataType.Density().SampleCount(telem.Size(i.internal.Len() - 1))
		err           error
	)
	if i.internal.Range().Start.Before(i.view.Start) {
		// we add 1 to the start offset because our range is inclusive, and the index
		// considers the end of the range exclusive
		target := i.internal.Range().Start.Range(i.view.Start + 1)
		startOffCount, err = i.idx.Distance(target, true)
		if err != nil {
			return 0, 0, err
		}
	}
	if i.internal.Range().End.After(i.view.End) {
		target := i.internal.Range().Start.Range(i.view.End)
		endOffCount, err = i.idx.Distance(target, true)
		if err != nil {
			return 0, 0, err
		}
	}
	startOffset := i.Channel.DataType.Density().Size(startOffCount)
	size := i.Channel.DataType.Density().Size(endOffCount+1) - startOffset
	return startOffset, size, nil
}

func (i *Iterator) satisfied() bool {
	if !i.partiallySatisfied() {
		return false
	}
	start := i.frame.Arrays[0].Range.Start
	end := i.frame.Arrays[len(i.frame.Arrays)-1].Range.End
	return i.view == start.Range(end)
}

func (i *Iterator) partiallySatisfied() bool { return len(i.frame.Arrays) > 0 }

func (i *Iterator) reset(nextView telem.TimeRange) {
	i.frame = telem.Frame{}
	i.view = nextView
}

func (i *Iterator) seekReset(ts telem.TimeStamp) {
	i.reset(ts.SpanRange(0))
	i.err = nil
}

func (i *Iterator) atStart() bool { return i.view.Start == i.bounds.Start }

func (i *Iterator) atEnd() bool { return i.view.End == i.bounds.End }

func (i *Iterator) log(msg string, fields ...zap.Field) {
	fields = append(
		fields,
		zap.String("channel", i.Channel.Key),
		zap.Stringer("view", i.view),
		zap.Error(i.err),
	)
	i.logger.Debug(msg, fields...)
}
