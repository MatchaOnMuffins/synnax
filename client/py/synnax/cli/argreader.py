import argparse
import os
from enum import Enum
from os import path


class Filetype(Enum):
    CSV = ".csv"
    XLSX = ".xlsx"


class ArgParser:
    def __init__(self):
        self.parser = argparse.ArgumentParser(
            description="CLI for Reading Flat Files to Synnax"
        )
        self.initParser(self.parser)
        self.args = self.parser.parse_args()

    def initParser(self, parser):
        parser.add_argument("filepath", type=str, help="filepath of the file to parse")
        parser.add_argument("hostname", type=str, help="IP to synnax node")
        parser.add_argument("port", type=int, default=8080, help="Port of synnax node")
        parser.add_argument(
            "-n",
            "--testname",
            type=str,
            nargs=1,
            metavar="testname",
            help="Name of test",
        )
        parser.add_argument(
            "-t",
            "--timestamp",
            type=str,
            nargs=1,
            metavar="timestamp",
            help="name of timestamp column",
        )

    def getFileType(self):
        filename, fileExtension = os.path.splitext(self.args.filepath)
        if fileExtension in [member.value for member in Filetype]:
            return Filetype(fileExtension)
        else:
            print("invalid filetype! must be ")
            for member in Filetype:
                print(member.value + ", ", end="")
            exit(-1)

    def getFilePath(self):
        if path.exists(self.args.filepath):
            return self.args.filepath
        else:
            print("File does not exists")
            exit(-10)

    def getHostname(self):
        return self.args.hostname

    def getPort(self):
        return self.args.port

    def getTimestampCol(self):
        return self.args.timestamp
