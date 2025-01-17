// Generated by the gRPC C++ plugin.
// If you make any local change, they will be lost.
// source: v1/framer.proto

#include "v1/framer.pb.h"
#include "v1/framer.grpc.pb.h"

#include <functional>
#include <grpcpp/support/async_stream.h>
#include <grpcpp/support/async_unary_call.h>
#include <grpcpp/impl/channel_interface.h>
#include <grpcpp/impl/client_unary_call.h>
#include <grpcpp/support/client_callback.h>
#include <grpcpp/support/message_allocator.h>
#include <grpcpp/support/method_handler.h>
#include <grpcpp/impl/rpc_service_method.h>
#include <grpcpp/support/server_callback.h>
#include <grpcpp/impl/server_callback_handlers.h>
#include <grpcpp/server_context.h>
#include <grpcpp/impl/service_type.h>
#include <grpcpp/support/sync_stream.h>
namespace api {
namespace v1 {

static const char* FrameService_method_names[] = {
  "/api.v1.FrameService/Iterate",
  "/api.v1.FrameService/Write",
  "/api.v1.FrameService/Stream",
};

std::unique_ptr< FrameService::Stub> FrameService::NewStub(const std::shared_ptr< ::grpc::ChannelInterface>& channel, const ::grpc::StubOptions& options) {
  (void)options;
  std::unique_ptr< FrameService::Stub> stub(new FrameService::Stub(channel, options));
  return stub;
}

FrameService::Stub::Stub(const std::shared_ptr< ::grpc::ChannelInterface>& channel, const ::grpc::StubOptions& options)
  : channel_(channel), rpcmethod_Iterate_(FrameService_method_names[0], options.suffix_for_stats(),::grpc::internal::RpcMethod::BIDI_STREAMING, channel)
  , rpcmethod_Write_(FrameService_method_names[1], options.suffix_for_stats(),::grpc::internal::RpcMethod::BIDI_STREAMING, channel)
  , rpcmethod_Stream_(FrameService_method_names[2], options.suffix_for_stats(),::grpc::internal::RpcMethod::BIDI_STREAMING, channel)
  {}

::grpc::ClientReaderWriter< ::api::v1::FrameIteratorRequest, ::api::v1::FrameIteratorResponse>* FrameService::Stub::IterateRaw(::grpc::ClientContext* context) {
  return ::grpc::internal::ClientReaderWriterFactory< ::api::v1::FrameIteratorRequest, ::api::v1::FrameIteratorResponse>::Create(channel_.get(), rpcmethod_Iterate_, context);
}

void FrameService::Stub::async::Iterate(::grpc::ClientContext* context, ::grpc::ClientBidiReactor< ::api::v1::FrameIteratorRequest,::api::v1::FrameIteratorResponse>* reactor) {
  ::grpc::internal::ClientCallbackReaderWriterFactory< ::api::v1::FrameIteratorRequest,::api::v1::FrameIteratorResponse>::Create(stub_->channel_.get(), stub_->rpcmethod_Iterate_, context, reactor);
}

::grpc::ClientAsyncReaderWriter< ::api::v1::FrameIteratorRequest, ::api::v1::FrameIteratorResponse>* FrameService::Stub::AsyncIterateRaw(::grpc::ClientContext* context, ::grpc::CompletionQueue* cq, void* tag) {
  return ::grpc::internal::ClientAsyncReaderWriterFactory< ::api::v1::FrameIteratorRequest, ::api::v1::FrameIteratorResponse>::Create(channel_.get(), cq, rpcmethod_Iterate_, context, true, tag);
}

::grpc::ClientAsyncReaderWriter< ::api::v1::FrameIteratorRequest, ::api::v1::FrameIteratorResponse>* FrameService::Stub::PrepareAsyncIterateRaw(::grpc::ClientContext* context, ::grpc::CompletionQueue* cq) {
  return ::grpc::internal::ClientAsyncReaderWriterFactory< ::api::v1::FrameIteratorRequest, ::api::v1::FrameIteratorResponse>::Create(channel_.get(), cq, rpcmethod_Iterate_, context, false, nullptr);
}

::grpc::ClientReaderWriter< ::api::v1::FrameWriterRequest, ::api::v1::FrameWriterResponse>* FrameService::Stub::WriteRaw(::grpc::ClientContext* context) {
  return ::grpc::internal::ClientReaderWriterFactory< ::api::v1::FrameWriterRequest, ::api::v1::FrameWriterResponse>::Create(channel_.get(), rpcmethod_Write_, context);
}

void FrameService::Stub::async::Write(::grpc::ClientContext* context, ::grpc::ClientBidiReactor< ::api::v1::FrameWriterRequest,::api::v1::FrameWriterResponse>* reactor) {
  ::grpc::internal::ClientCallbackReaderWriterFactory< ::api::v1::FrameWriterRequest,::api::v1::FrameWriterResponse>::Create(stub_->channel_.get(), stub_->rpcmethod_Write_, context, reactor);
}

::grpc::ClientAsyncReaderWriter< ::api::v1::FrameWriterRequest, ::api::v1::FrameWriterResponse>* FrameService::Stub::AsyncWriteRaw(::grpc::ClientContext* context, ::grpc::CompletionQueue* cq, void* tag) {
  return ::grpc::internal::ClientAsyncReaderWriterFactory< ::api::v1::FrameWriterRequest, ::api::v1::FrameWriterResponse>::Create(channel_.get(), cq, rpcmethod_Write_, context, true, tag);
}

::grpc::ClientAsyncReaderWriter< ::api::v1::FrameWriterRequest, ::api::v1::FrameWriterResponse>* FrameService::Stub::PrepareAsyncWriteRaw(::grpc::ClientContext* context, ::grpc::CompletionQueue* cq) {
  return ::grpc::internal::ClientAsyncReaderWriterFactory< ::api::v1::FrameWriterRequest, ::api::v1::FrameWriterResponse>::Create(channel_.get(), cq, rpcmethod_Write_, context, false, nullptr);
}

::grpc::ClientReaderWriter< ::api::v1::FrameStreamerRequest, ::api::v1::FrameStreamerResponse>* FrameService::Stub::StreamRaw(::grpc::ClientContext* context) {
  return ::grpc::internal::ClientReaderWriterFactory< ::api::v1::FrameStreamerRequest, ::api::v1::FrameStreamerResponse>::Create(channel_.get(), rpcmethod_Stream_, context);
}

void FrameService::Stub::async::Stream(::grpc::ClientContext* context, ::grpc::ClientBidiReactor< ::api::v1::FrameStreamerRequest,::api::v1::FrameStreamerResponse>* reactor) {
  ::grpc::internal::ClientCallbackReaderWriterFactory< ::api::v1::FrameStreamerRequest,::api::v1::FrameStreamerResponse>::Create(stub_->channel_.get(), stub_->rpcmethod_Stream_, context, reactor);
}

::grpc::ClientAsyncReaderWriter< ::api::v1::FrameStreamerRequest, ::api::v1::FrameStreamerResponse>* FrameService::Stub::AsyncStreamRaw(::grpc::ClientContext* context, ::grpc::CompletionQueue* cq, void* tag) {
  return ::grpc::internal::ClientAsyncReaderWriterFactory< ::api::v1::FrameStreamerRequest, ::api::v1::FrameStreamerResponse>::Create(channel_.get(), cq, rpcmethod_Stream_, context, true, tag);
}

::grpc::ClientAsyncReaderWriter< ::api::v1::FrameStreamerRequest, ::api::v1::FrameStreamerResponse>* FrameService::Stub::PrepareAsyncStreamRaw(::grpc::ClientContext* context, ::grpc::CompletionQueue* cq) {
  return ::grpc::internal::ClientAsyncReaderWriterFactory< ::api::v1::FrameStreamerRequest, ::api::v1::FrameStreamerResponse>::Create(channel_.get(), cq, rpcmethod_Stream_, context, false, nullptr);
}

FrameService::Service::Service() {
  AddMethod(new ::grpc::internal::RpcServiceMethod(
      FrameService_method_names[0],
      ::grpc::internal::RpcMethod::BIDI_STREAMING,
      new ::grpc::internal::BidiStreamingHandler< FrameService::Service, ::api::v1::FrameIteratorRequest, ::api::v1::FrameIteratorResponse>(
          [](FrameService::Service* service,
             ::grpc::ServerContext* ctx,
             ::grpc::ServerReaderWriter<::api::v1::FrameIteratorResponse,
             ::api::v1::FrameIteratorRequest>* stream) {
               return service->Iterate(ctx, stream);
             }, this)));
  AddMethod(new ::grpc::internal::RpcServiceMethod(
      FrameService_method_names[1],
      ::grpc::internal::RpcMethod::BIDI_STREAMING,
      new ::grpc::internal::BidiStreamingHandler< FrameService::Service, ::api::v1::FrameWriterRequest, ::api::v1::FrameWriterResponse>(
          [](FrameService::Service* service,
             ::grpc::ServerContext* ctx,
             ::grpc::ServerReaderWriter<::api::v1::FrameWriterResponse,
             ::api::v1::FrameWriterRequest>* stream) {
               return service->Write(ctx, stream);
             }, this)));
  AddMethod(new ::grpc::internal::RpcServiceMethod(
      FrameService_method_names[2],
      ::grpc::internal::RpcMethod::BIDI_STREAMING,
      new ::grpc::internal::BidiStreamingHandler< FrameService::Service, ::api::v1::FrameStreamerRequest, ::api::v1::FrameStreamerResponse>(
          [](FrameService::Service* service,
             ::grpc::ServerContext* ctx,
             ::grpc::ServerReaderWriter<::api::v1::FrameStreamerResponse,
             ::api::v1::FrameStreamerRequest>* stream) {
               return service->Stream(ctx, stream);
             }, this)));
}

FrameService::Service::~Service() {
}

::grpc::Status FrameService::Service::Iterate(::grpc::ServerContext* context, ::grpc::ServerReaderWriter< ::api::v1::FrameIteratorResponse, ::api::v1::FrameIteratorRequest>* stream) {
  (void) context;
  (void) stream;
  return ::grpc::Status(::grpc::StatusCode::UNIMPLEMENTED, "");
}

::grpc::Status FrameService::Service::Write(::grpc::ServerContext* context, ::grpc::ServerReaderWriter< ::api::v1::FrameWriterResponse, ::api::v1::FrameWriterRequest>* stream) {
  (void) context;
  (void) stream;
  return ::grpc::Status(::grpc::StatusCode::UNIMPLEMENTED, "");
}

::grpc::Status FrameService::Service::Stream(::grpc::ServerContext* context, ::grpc::ServerReaderWriter< ::api::v1::FrameStreamerResponse, ::api::v1::FrameStreamerRequest>* stream) {
  (void) context;
  (void) stream;
  return ::grpc::Status(::grpc::StatusCode::UNIMPLEMENTED, "");
}


}  // namespace api
}  // namespace v1

