package cesium

import (
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/cesium/internal/unary"
)

// openUnary opens the unary database for the given channel. If the database already exists,
// the only property that needs to be set on the channel is its key (as the existing database
// is assumed to live in a subdirectory named by the key). If the database does not
// exist, the channel must be fully populated and the database will be created.
func (db *cesium) openUnary(ch Channel) error {
	fs, err := db.fs.Sub(ch.Key)
	if err != nil {
		return err
	}
	u, err := unary.Open(unary.Config{FS: fs, Channel: ch, Logger: db.logger})
	if err != nil {
		return err
	}

	// In the case where we index the data using a separate index database, we
	// need to set the index on the unary database. Otherwise, we assume the database
	// is self-indexing.
	if u.Channel.Index != "" && !u.Channel.IsIndex {
		idxDB, ok := db.dbs[u.Channel.Index]
		if !ok {
			panic("index database not found")
		}
		u.SetIndex((&idxDB).Index())
	}

	db.dbs[ch.Key] = *u
	return nil
}

func (db *cesium) getUnary(key string) (unary.DB, error) {
	u, ok := db.dbs[key]
	if !ok {
		return unary.DB{}, errors.Wrapf(ChannelNotFound, "channel: %s", key)
	}
	return u, nil
}
