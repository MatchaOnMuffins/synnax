// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.28.1
// 	protoc        (unknown)
// source: telempb/telem.proto

package telempb

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type TimeRange struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Start int64 `protobuf:"varint,1,opt,name=start,proto3" json:"start,omitempty"`
	End   int64 `protobuf:"varint,2,opt,name=end,proto3" json:"end,omitempty"`
}

func (x *TimeRange) Reset() {
	*x = TimeRange{}
	if protoimpl.UnsafeEnabled {
		mi := &file_telempb_telem_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *TimeRange) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*TimeRange) ProtoMessage() {}

func (x *TimeRange) ProtoReflect() protoreflect.Message {
	mi := &file_telempb_telem_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use TimeRange.ProtoReflect.Descriptor instead.
func (*TimeRange) Descriptor() ([]byte, []int) {
	return file_telempb_telem_proto_rawDescGZIP(), []int{0}
}

func (x *TimeRange) GetStart() int64 {
	if x != nil {
		return x.Start
	}
	return 0
}

func (x *TimeRange) GetEnd() int64 {
	if x != nil {
		return x.End
	}
	return 0
}

type Series struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	TimeRange *TimeRange `protobuf:"bytes,1,opt,name=time_range,json=timeRange,proto3" json:"time_range,omitempty"`
	DataType  string     `protobuf:"bytes,2,opt,name=data_type,json=dataType,proto3" json:"data_type,omitempty"`
	Data      []byte     `protobuf:"bytes,3,opt,name=data,proto3" json:"data,omitempty"`
}

func (x *Series) Reset() {
	*x = Series{}
	if protoimpl.UnsafeEnabled {
		mi := &file_telempb_telem_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Series) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Series) ProtoMessage() {}

func (x *Series) ProtoReflect() protoreflect.Message {
	mi := &file_telempb_telem_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Series.ProtoReflect.Descriptor instead.
func (*Series) Descriptor() ([]byte, []int) {
	return file_telempb_telem_proto_rawDescGZIP(), []int{1}
}

func (x *Series) GetTimeRange() *TimeRange {
	if x != nil {
		return x.TimeRange
	}
	return nil
}

func (x *Series) GetDataType() string {
	if x != nil {
		return x.DataType
	}
	return ""
}

func (x *Series) GetData() []byte {
	if x != nil {
		return x.Data
	}
	return nil
}

var File_telempb_telem_proto protoreflect.FileDescriptor

var file_telempb_telem_proto_rawDesc = []byte{
	0x0a, 0x13, 0x74, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62, 0x2f, 0x74, 0x65, 0x6c, 0x65, 0x6d, 0x2e,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x07, 0x74, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62, 0x22, 0x33,
	0x0a, 0x09, 0x54, 0x69, 0x6d, 0x65, 0x52, 0x61, 0x6e, 0x67, 0x65, 0x12, 0x14, 0x0a, 0x05, 0x73,
	0x74, 0x61, 0x72, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x03, 0x52, 0x05, 0x73, 0x74, 0x61, 0x72,
	0x74, 0x12, 0x10, 0x0a, 0x03, 0x65, 0x6e, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x03, 0x52, 0x03,
	0x65, 0x6e, 0x64, 0x22, 0x6c, 0x0a, 0x06, 0x53, 0x65, 0x72, 0x69, 0x65, 0x73, 0x12, 0x31, 0x0a,
	0x0a, 0x74, 0x69, 0x6d, 0x65, 0x5f, 0x72, 0x61, 0x6e, 0x67, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x0b, 0x32, 0x12, 0x2e, 0x74, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62, 0x2e, 0x54, 0x69, 0x6d, 0x65,
	0x52, 0x61, 0x6e, 0x67, 0x65, 0x52, 0x09, 0x74, 0x69, 0x6d, 0x65, 0x52, 0x61, 0x6e, 0x67, 0x65,
	0x12, 0x1b, 0x0a, 0x09, 0x64, 0x61, 0x74, 0x61, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x18, 0x02, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x08, 0x64, 0x61, 0x74, 0x61, 0x54, 0x79, 0x70, 0x65, 0x12, 0x12, 0x0a,
	0x04, 0x64, 0x61, 0x74, 0x61, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x04, 0x64, 0x61, 0x74,
	0x61, 0x42, 0x7e, 0x0a, 0x0b, 0x63, 0x6f, 0x6d, 0x2e, 0x74, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62,
	0x42, 0x0a, 0x54, 0x65, 0x6c, 0x65, 0x6d, 0x50, 0x72, 0x6f, 0x74, 0x6f, 0x50, 0x01, 0x5a, 0x27,
	0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x79, 0x6e, 0x6e, 0x61,
	0x78, 0x6c, 0x61, 0x62, 0x73, 0x2f, 0x78, 0x2f, 0x74, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62, 0x2f,
	0x74, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62, 0xa2, 0x02, 0x03, 0x54, 0x58, 0x58, 0xaa, 0x02, 0x07,
	0x54, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62, 0xca, 0x02, 0x07, 0x54, 0x65, 0x6c, 0x65, 0x6d, 0x70,
	0x62, 0xe2, 0x02, 0x13, 0x54, 0x65, 0x6c, 0x65, 0x6d, 0x70, 0x62, 0x5c, 0x47, 0x50, 0x42, 0x4d,
	0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0xea, 0x02, 0x07, 0x54, 0x65, 0x6c, 0x65, 0x6d, 0x70,
	0x62, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_telempb_telem_proto_rawDescOnce sync.Once
	file_telempb_telem_proto_rawDescData = file_telempb_telem_proto_rawDesc
)

func file_telempb_telem_proto_rawDescGZIP() []byte {
	file_telempb_telem_proto_rawDescOnce.Do(func() {
		file_telempb_telem_proto_rawDescData = protoimpl.X.CompressGZIP(file_telempb_telem_proto_rawDescData)
	})
	return file_telempb_telem_proto_rawDescData
}

var file_telempb_telem_proto_msgTypes = make([]protoimpl.MessageInfo, 2)
var file_telempb_telem_proto_goTypes = []interface{}{
	(*TimeRange)(nil), // 0: telempb.TimeRange
	(*Series)(nil),    // 1: telempb.Series
}
var file_telempb_telem_proto_depIdxs = []int32{
	0, // 0: telempb.Series.time_range:type_name -> telempb.TimeRange
	1, // [1:1] is the sub-list for method output_type
	1, // [1:1] is the sub-list for method input_type
	1, // [1:1] is the sub-list for extension type_name
	1, // [1:1] is the sub-list for extension extendee
	0, // [0:1] is the sub-list for field type_name
}

func init() { file_telempb_telem_proto_init() }
func file_telempb_telem_proto_init() {
	if File_telempb_telem_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_telempb_telem_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*TimeRange); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_telempb_telem_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Series); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_telempb_telem_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   2,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_telempb_telem_proto_goTypes,
		DependencyIndexes: file_telempb_telem_proto_depIdxs,
		MessageInfos:      file_telempb_telem_proto_msgTypes,
	}.Build()
	File_telempb_telem_proto = out.File
	file_telempb_telem_proto_rawDesc = nil
	file_telempb_telem_proto_goTypes = nil
	file_telempb_telem_proto_depIdxs = nil
}
