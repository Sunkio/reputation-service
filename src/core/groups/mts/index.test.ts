import { MerkleTreeNode, MerkleTreeNodeDocument } from "@interrep/db"
import { MerkleTree } from "@interrep/merkle-tree"
import { OAuthProvider, ReputationLevel } from "@interrep/reputation-criteria"
import { poseidon } from "circomlibjs"
import config from "src/config"
import seedZeroHashes from "src/utils/backend/seeding/seedZeroHashes"
import { clearDatabase, connectDatabase, dropDatabaseAndDisconnect } from "src/utils/backend/testDatabase"
import poseidonHash from "src/utils/common/crypto/hasher"
import { appendLeaf, retrievePath } from "."
import { PoapGroupName } from "../poap"

describe("Merkle Trees", () => {
    const idCommitment = poseidon([2n, 1n]).toString()
    const provider = OAuthProvider.TWITTER
    const reputation = ReputationLevel.GOLD

    beforeAll(async () => {
        await connectDatabase()
    })

    afterAll(async () => {
        await dropDatabaseAndDisconnect()
    })

    describe("appendLeaf", () => {
        beforeEach(async () => {
            await clearDatabase()
        })

        it("Should not append any leaf if the group id does not exist", async () => {
            await seedZeroHashes(false)

            const fun = (): Promise<string> => appendLeaf(provider, PoapGroupName.DEVCON_3, idCommitment)

            await expect(fun).rejects.toThrow()
        })

        it("Should not append any leaf without first creating the zero hashes", async () => {
            const fun = (): Promise<string> => appendLeaf(provider, reputation, idCommitment)

            await expect(fun).rejects.toThrow()
        })

        it("Should not append the same identity twice", async () => {
            await seedZeroHashes(false)

            await appendLeaf(provider, reputation, idCommitment)
            const fun = (): Promise<string> => appendLeaf(provider, reputation, idCommitment)

            await expect(fun).rejects.toThrow()
        })

        it("Should append two leaves and their parent hash should match the hash of the id commitments", async () => {
            await seedZeroHashes(false)
            const idCommitments = [poseidon([1]).toString(), poseidon([2]).toString()]

            await appendLeaf(provider, reputation, idCommitments[0])
            await appendLeaf(provider, reputation, idCommitments[1])

            const node = (await MerkleTreeNode.findByGroupAndLevelAndIndex(
                { provider, name: reputation },
                1,
                0
            )) as MerkleTreeNodeDocument
            const hash = poseidonHash(idCommitments[0], idCommitments[1])

            expect(hash).toBe(node.hash)
        })

        it("Should append 10 leaves correctly", async () => {
            await seedZeroHashes(false)

            for (let i = 0; i < 10; i++) {
                const idCommitment = poseidon([BigInt(i)]).toString()

                await appendLeaf(provider, reputation, idCommitment)
            }

            const expectedNumberOfNodes = [10, 5, 3, 2, 1, 1, 1]

            for (let i = 0; i < expectedNumberOfNodes.length; i++) {
                const numberOfNodes = await MerkleTreeNode.getNumberOfNodes({ provider, name: reputation }, i)

                expect(numberOfNodes).toBe(expectedNumberOfNodes[i])
            }
        })
    })

    describe("retrievePath", () => {
        beforeEach(async () => {
            await clearDatabase()
        })

        it(`Should not return any path if the identity commitment does not exist`, async () => {
            const fun = (): Promise<string[]> => retrievePath(provider, reputation, idCommitment)

            await expect(fun).rejects.toThrow()
        })

        it(`Should return a path of ${config.MERKLE_TREE_DEPTH} hashes`, async () => {
            await seedZeroHashes(false)

            const idCommitments = []

            for (let i = 0; i < 10; i++) {
                idCommitments.push(poseidon([BigInt(i)]).toString())

                await appendLeaf(provider, reputation, idCommitments[i])
            }

            const path = await retrievePath(provider, reputation, idCommitments[5])

            expect(path.pathElements).toHaveLength(config.MERKLE_TREE_DEPTH)
            expect(path.indices).toHaveLength(config.MERKLE_TREE_DEPTH)
        })

        it("Should match the path obtained with the 'incrementalquintree' library", async () => {
            await seedZeroHashes(false)

            const tree = new MerkleTree(poseidon, config.MERKLE_TREE_DEPTH)
            const idCommitments = []

            for (let i = 0; i < 10; i++) {
                idCommitments.push(poseidon([BigInt(i)]).toString())

                await appendLeaf(provider, reputation, idCommitments[i])
                tree.insert(BigInt(idCommitments[i]))
            }

            const path1 = await retrievePath(provider, reputation, idCommitments[5])

            const { path, siblingNodes } = tree.createProof(5)

            expect(path1.indices).toStrictEqual(path)
            expect(path1.pathElements).toStrictEqual(siblingNodes.map(String))
        })
    })
})
