package kv

// MultiCommitBatch is a batch that wraps a kv.BatchWriter to implement the Batch interface,
// and allows for multiple commits to be made on the same batch.
type MultiCommitBatch struct {
	db BatchWriter
	Batch
}

func NewMultiCommitBatch(db BatchWriter) Batch {
	return &MultiCommitBatch{db: db, Batch: db.NewBatch()}
}

// Commit implements the Batch interface. It commits the batch to the underlying DB, and
// creates a new batch to continue writing to.
func (b *MultiCommitBatch) Commit(opts ...interface{}) error {
	if err := b.Batch.Commit(opts...); err != nil {
		return err
	}
	err := b.Close()
	b.Batch = b.db.NewBatch()
	return err
}
